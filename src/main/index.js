const electron = require('electron');
const {app, BrowserWindow, ipcMain, dialog, shell, clipboard} = electron;

const uncaughtExceptionHandler = (err, title = 'Application Error', type = 'error') => {
	console.error(`uncaught exception`, err, title, type)
	
	const
		window = BrowserWindow.getFocusedWindow();
	
	if (window || BrowserWindow.getAllWindows().length) {
		let action = dialog.showMessageBox(window, {
			title: title,
			buttons: ['Copy & Report', 'Ignore'],
			type: type,
			message: err.message,
			detail: err.stack,
		});
		// Report it
		if (action === 0) {
			clipboard.writeText(`
#### Application Error
##### Message
${err.message}
##### Stack Trace
` + "```js\n" + err.stack + "\n```\n" + `
#### System Details
 | …
------------ | -------------
**Platform** | ${process.platform}
**Arch** | ${process.arch}
**Electron Version** | ${process.versions.electron}
**Mancy Version** | ${Config.version}

`
			);
			shell.openExternal(Config.bugs.url);
		}
	} else {
		dialog.showErrorBox('Application Error', `${err.stack}
Please report it to ${Config.bugs.url}`);
	}
};

process.on('uncaughtException', uncaughtExceptionHandler);

try {
	
	
	const path = require('path');
	const {MenuManager} = require('./MenuManager');
	const Config = require('../package.json');
	const _ = require('lodash');
	const fs = require('fs');
	
	
	const globalShortcut = electron.globalShortcut;
	const {argv} = require('yargs')
		.usage('Usage: $0 [options]')
		.boolean('d')
		.alias('d', 'debug')
		.describe('d', 'Run in debug mode')
		.alias('e', 'editor')
		.nargs('e', 1)
		.describe('e', `REPL or Notebook(experimental) mode.
Allowed values:
  'repl', 'notebook'
                `)
		.example('$0 -e repl', 'Set editor mode as REPL')
		.alias('j', 'js-flags')
		.nargs('j', 1)
		.describe('j', `js flags for nodejs.`)
		.example('$0 --js-flags="--harmony_destructuring"', 'Enable destructuring harmony flag')
		.alias('l', 'lang')
		.nargs('l', 1)
		.describe('l', `Scripting language.
Allowed values:
  'js', 'javascript', 'babel'
  'ts', 'typescript'
  'ls', 'livescript'
  'coffee', 'coffeescript'
  'cljs', 'clojurescript'
                `)
		.example('$0 -l ts', 'Set language as typescript')
		.alias('m', 'mode')
		.nargs('m', 1)
		.describe('m', `REPL mode (applicable only for --lang=js).
Allowed values:
  'sloppy' or 'strict'
                `)
		.example('$0 -m strict', 'Set JS mode as strict')
		.alias('p', 'path')
		.nargs('p', 1)
		.describe('p', `Add npm path(s) with path delimiter`)
		.example('$0 -p /Users/princejohnwesley/Projects/Playground/sample', 'Add npm path')
		.alias('s', 'script')
		.nargs('s', 1)
		.describe('s', 'Start up script file to load.')
		.example('$0 -s script.js', 'Load script.js on start up')
		.alias('t', 'theme')
		.nargs('t', 1)
		.describe('t', `Editor theme.
Allowed values:
  dark', 'light'
                `)
		.example('$0 -t dark', 'Set dark theme')
		.alias('i', 'import')
		.alias('i', 'session')
		.nargs('i', 1)
		.describe('i', `Import session`)
		.example('$0 -i session-file', 'Import session-file')
		.help('h')
		.alias('h', 'help')
		.epilog(`Made with ♥︎ by toolitup.com
copyright 2015
                  `);
	
	const HISTORY_FILE = path.join(app.getPath('userData'), '.mancy_history');
// babel leaking __core-js_shared__
	const globalNames = Object.getOwnPropertyNames(global).filter(g => g !== '__core-js_shared__');
	const windowCache = {};
	const dockNotificationCache = {};
	const menuManagerCache = {};
	let windowCount = 0;
	let promptOnClose = false;
	let history = [];
	let historySize = 0;
	let noAccessToHistory = false;
	let appReady = false;
	
	console.log(`Configuring`)
	
	app.commandLine.appendSwitch('js-flags', argv.jsFlags || argv.j);
	
	function onCloseWindow(e, title, detail) {
		// save history
		const window = BrowserWindow.getFocusedWindow();
		if (window && window.id && windowCache[window.id]) {
			saveHistory(null, windowCache[window.id].history);
			windowCache[window.id].history = [];
		}
		let ret = promptOnClose;
		if (promptOnClose) {
			try {
				ret = !!dialog.showMessageBox(window, {
					title: title || 'Close Window',
					buttons: ['Close', 'Cancel'],
					type: 'question',
					message: title || 'Close Window',
					detail: detail || `Do you want to close this window?`
				});
			} catch (e) {
				ret = false;
			}
		}
		if (ret) {
			e.preventDefault();
		}
		e.returnValue = !ret;
	}
	
	function onFocusWindow(e) {
		e.sender.webContents.send('application:focus');
	}
	
	
	function onUnresponsiveWindow(e) {
		const window = BrowserWindow.getFocusedWindow();
		dialog.showMessageBox(window, {
			title: 'Application is not responding',
			buttons: ['Dismiss'],
			type: 'warning',
			message: 'Application is not responding…',
		});
	}
	
	function onCrashedWindow(e) {
		uncaughtExceptionHandler(e, 'Mancy Window is crashed');
	}
	
	function initHistory() {
		fs.readFile(HISTORY_FILE, (err, data) => {
			if (err) {
				if (err.code === 'ENOENT') {
					history = [];
					fs.writeFile(HISTORY_FILE, "[]", (err) => {
						if (err) {
							noAccessToHistory = true;
							console.error(`Failed to write history file ${err.message}`);
						}
					});
				} else {
					console.error(`Failed to read history file ${err.message}`);
				}
			} else {
				try {
					const
						historyStr = data.toString()
					console.log(`Read history`, historyStr)
					history = JSON.parse(historyStr);
				} catch (e) {
					// corrupted history
					history = []
				}
			}
		});
	}
	
	
	app.on('window-all-closed', () => {
		promptOnClose = false;
		if (process.platform !== 'darwin') {
			app.quit();
		}
	});
	
	app.on('before-quit', (e) => {
		var windows = BrowserWindow.getAllWindows();
		if (!windows.length) {
			return;
		}
		var window = BrowserWindow.getFocusedWindow();
		if (!window) {
			windows[0].show();
		}
		onCloseWindow(e, 'Quit Mancy', 'Do you want to quit?');
		if (e.returnValue) {
			promptOnClose = false;
		} else {
			e.preventDefault();
		}
	});

//app.on('browser-window-blur', (event, window) => window.$focus = false);
	
	app.on('browser-window-focus', (event, window) => {
		window.$focus = true;
		dockNotificationCache[window.id] = 0;
		if (process.platform === 'darwin' ||
			(process.platform === 'linux' && app.isUnityRunning &&
			app.isUnityRunning())) {
			app.setBadgeCount(0);
		}
	});
	
	function updateHistorySize(event, size) {
		if (size < 0) {
			return;
		}
		historySize = size;
		const sz = history.length;
		// when size is 0, stop writing history,(turn off)
		// dont erase it
		if (sz > size) {
			history = history.slice(sz - size);
		}
	}
	
	ipcMain.on('application:history-size', updateHistorySize);
	
	ipcMain.on('application:history', (event) => event.returnValue = history);
	ipcMain.on('application:history-append', (event, cmd = '') => {
		if (!cmd) {
			return;
		}
		let {id} = BrowserWindow.getFocusedWindow();
		let cache = windowCache[id];
		if (!cache.history) {
			cache.history = [];
		}
		cache.history.push(cmd);
	});
	
	ipcMain.on('application:history-aggressive', (event, flag) => {
		if (!flag) {
			return;
		}
		let {id} = BrowserWindow.getFocusedWindow();
		let cache = windowCache[id];
		if (cache.history && cache.history.length) {
			saveHistory(null, cache.history);
			cache.history = [];
		}
	});
	
	function saveHistory(event, cmds = []) {
		if (noAccessToHistory ||
			historySize === 0 || !_.isArray(cmds) ||
			cmds.length === 0
		) {
			return;
		}
		// remove adjacent duplicates
		history = _.uniq(history.concat(cmds), true);
		// trim history
		updateHistorySize(null, historySize);
		// rewrite
		fs.writeFile(HISTORY_FILE, JSON.stringify(history), (err) => {
			if (err) {
				noAccessToHistory = true;
				console.error(`Failed to write history file ${err.message}`);
			}
		});
	}
	
	ipcMain.on('application:history-save', saveHistory);
	
	
	ipcMain.on('application:prompt-on-close', (event, flag) => promptOnClose = flag);
	
	const langs = {
		'js': 'js', 'javascript': 'js', 'babel': 'js',
		'ts': 'ts', 'typescript': 'ts',
		'ls': 'ls', 'livescript': 'ls',
		'coffee': 'coffee', 'coffeescript': 'coffee',
		'cljs': 'cljs', 'clojurescript': 'cljs',
	};
	const modes = {'strict': 'Strict', 'sloppy': 'Sloppy'};
	const editors = {'notebook': 'Notebook', 'repl': 'REPL'};
	const themes = {
		'dark': 'application:view-theme-dark',
		'light': 'application:view-theme-light'
	};
	const processParamHandler = (browser) => {
		// theme option '-t' or '--theme'
		const theme = argv.t || argv.theme;
		if (theme && themes[theme]) {
			browser.webContents.send(themes[theme]);
		}
		
		// language option '-l' or '--lang'
		const lang = argv.l || argv.lang;
		if (lang && langs[lang]) {
			browser.webContents.send('application:prompt-language', langs[lang]);
			if (lang === 'babel') {
				browser.webContents.send('application:transpile-babel');
			}
		}
		
		// repl mode option '-m' or '--mode'
		const mode = argv.m || argv.mode;
		if (mode && modes[mode]) {
			browser.webContents.send('application:prompt-mode', modes[mode]);
		}
		
		// editor mode option '-e' or '--editor'
		const editor = argv.e || argv.editor;
		if (editor && editors[editor]) {
			browser.webContents.send('application:editor-mode', editors[editor]);
		}
		
		// load script option '-s' or '--script'
		const script = argv.s || argv.script;
		if (script) {
			browser.webContents.send('application:load-file', script);
		}
		// not so strict
		if (theme || lang || mode || editor || script) {
			browser.webContents.send('application:sync-session');
		}
		
		// import session
		const session = argv.i || argv.import || argv.session;
		if (session) {
			browser.webContents.send('application:import-file', session);
		}
		
		// add path
		const p = argv.p || argv.path;
		if (p) {
			browser.webContents.send('application:add-path', p.split(path.delimiter));
		}
	};
	
	console.log(`app events`)
	app.on('ready', (label) => {
		appReady = true;
		onReady(label !== 'new-window' ? processParamHandler : null);
	});
	app.on('ready-action', () => appReady ? onReady() : null);
	app.on('activate', (event, hasVisibleWindows) => {
		if (!hasVisibleWindows && appReady) {
			onReady();
		}
	});
	
	ipcMain.on('application:global-context-names', (event, options) => {
		event.returnValue = globalNames;
	});
	
	ipcMain.on('application:open-sync-resource', (event, options) => {
		event.returnValue = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options) || [];
	});
	
	ipcMain.on('application:message-box', function (event, options) {
		dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
	});
	
	ipcMain.on('application:download', function (event, buffer) {
		let filename = dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
			title: 'Download to File…',
			filters: [
				{name: 'All Files', extensions: ['*']}
			]
		});
		if (filename) {
			fs.writeFile(filename, buffer, (err) => {
				let options = {buttons: ['Close']};
				if (err) {
					options = _.extend(options, {
						title: 'Download Error',
						type: 'error',
						message: err.name || 'Export Error',
						detail: err.toString()
					});
				} else {
					options = _.extend(options, {
						title: 'Download Success',
						type: 'info',
						message: `Saved to ${filename}`
					});
				}
				dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
			});
		}
	});
	
	ipcMain.on('application:dock-message-notification', function (event, id) {
		dockNotificationCache[id] = dockNotificationCache[id] + 1;
		if (process.platform === 'darwin' ||
			(process.platform === 'linux' && app.isUnityRunning &&
			app.isUnityRunning())) {
			app.setBadgeCount(dockNotificationCache[id]);
		}
		if (process.platform === 'darwin') {
			app.dock.bounce();
		}
	});
	
	function onReady(fun) {
		console.log('onReady, creating window')
		let {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
		let options = {
			width: width * 0.75,
			height: height * 0.75,
			minHeight: height * 0.5,
			minWidth: width * 0.5,
			resizable: true,
			webPreferences: {
				blinkFeatures: 'OverlayScrollbars',
				plugins: true,
				experimentalFeatures: true,
				experimentalCanvasFeatures: true,
				webgl: true,
				scrollBounce: true
			},
			show: false,
			backgroundColor: '#F5F5F5'
		}
		if (process.platform === 'linux') {
			options.icon = path.resolve(__dirname, '..', 'icons', 'mancy.png');
		}
		let mainWindow = new BrowserWindow(options);
		let id = mainWindow.id;
		windowCache[id] = mainWindow;
		let menuManager = menuManagerCache[id] = new MenuManager(argv);
		
		mainWindow.loadURL(`file://${__dirname}/../index.html`);
		mainWindow.setTitle(`${_.capitalize(Config.name)} - REPL(${windowCount})`);
		windowCount += 1;
		
		mainWindow.on('closed', () => windowCache[id] = menuManagerCache[id] = null);
		mainWindow.on('close', onCloseWindow);
		mainWindow.on('focus', onFocusWindow);
		mainWindow.on('unresponsive', onUnresponsiveWindow)
		mainWindow.flashFrame(true);
		
		
		mainWindow.webContents.on('did-finish-load', () => {
			let totalActiveWindows = _.keys(windowCache).length;
			if (totalActiveWindows > 1) {
				let fixPos = (axis, adj) => {
					let naxis = axis + adj;
					return naxis <= 0 ? axis : naxis;
				};
				let [x, y] = mainWindow.getPosition();
				let adj = parseInt(Math.random() * 50) * (Math.random() > 0.3 ? -1 : 1);
				let [nx, ny] = [fixPos(x, adj), fixPos(y, adj)];
				mainWindow.setPosition(nx, ny, true);
			}
			mainWindow.show();
			// Mac only
			if (process.platform === 'darwin') {
				mainWindow.showDefinitionForSelection(true);
				//mainWindow.setVisibleOnAllWorkspaces(true);
			}
			
			if (typeof fun === 'function') {
				setTimeout(() => fun(mainWindow), 200);
			}
		});
		mainWindow.webContents.on('crashed', onCrashedWindow);
	}
	
	initHistory();
	
	if (app.isReady()) {
		console.log(`App is ready, starting`)
		processParamHandler(null)
	}
} catch (err) {
	console.error(`Something went wrong`, err)
}

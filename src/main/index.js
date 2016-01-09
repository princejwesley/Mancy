const app = require('app');
const path = require('path');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const {MenuManager} = require('./MenuManager');
const Config = require('../package.json');
const _ = require('lodash');
const ipc = electron.ipcMain;
const fs = require('fs');
const dialog = require('dialog');
const globalShortcut = electron.globalShortcut;

const windowCache = {};
const dockNotificationCache = {};
const menuManagerCache = {};
let windowCount = 0;
let promptOnClose = false;

// set application root path as current working directory
process.chdir(app.getAppPath());

function onCloseWindow(e, title, detail) {
  var ret = promptOnClose;
  if(promptOnClose) {
    try {
      ret = !!dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        title: title || 'Close Window',
        buttons: ['Close', 'Cancel'],
        type: 'question',
        message: title || 'Close Window',
        detail: detail || `Do you want to close this window?`
      });
    } catch(e) { ret = false; }
  }
  if(ret) {  e.preventDefault(); }
  e.returnValue = !ret;
}

function onFocusWindow(e) {
  e.sender.webContents.send('application:focus');
}

app.on('window-all-closed', () => {
  promptOnClose = false;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (e) => {
  var windows = BrowserWindow.getAllWindows();
  if(!windows.length) { return; }
  var window = BrowserWindow.getFocusedWindow();
  if(!window) {
    windows[0].show();
  }
  onCloseWindow(e, 'Quit Mancy', 'Do you want to quit?');
  if(e.returnValue) {
    promptOnClose = false;
  } else {
    e.preventDefault();
  }
});

app.on('browser-window-blur', (event, window) => window.$focus = false);

app.on('browser-window-focus', (event, window) => {
  window.$focus = true;
  dockNotificationCache[window.id] = 0;
  if (process.platform === 'darwin') {
    app.dock.setBadge('');
  }
});

ipc.on('application:prompt-on-close', (event, flag) => promptOnClose = flag);

app.on('ready', onReady);
app.on('ready-action', onReady);
app.on('activate', (event, hasVisibleWindows) => {
  if(!hasVisibleWindows) {
    onReady();
  }
});

ipc.on('application:open-sync-resource', (event, options) => {
  event.returnValue = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options) || [];
});

ipc.on('application:message-box', function(event, options) {
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
});

ipc.on('application:download', function(event, buffer) {
  let filename = dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Download to File…',
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if(filename) {
    fs.writeFile(filename, buffer, (err) => {
      let options = { buttons: ['Close'] };
      if(err) {
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

ipc.on('application:dock-message-notification', function(event, id) {
  dockNotificationCache[id] = dockNotificationCache[id] + 1;
  if (process.platform === 'darwin') {
    app.dock.setBadge(`${dockNotificationCache[id]}`);
    app.dock.bounce();
  }
});

function onReady(fun) {
  let {width, height} = require('screen').getPrimaryDisplay().workAreaSize;
  let options = {
    width: width * 0.75,
    height: height * 0.75,
    minHeight: height * 0.5,
    minWidth: width * 0.5,
    resizable: true,
    webPreferences: {
      overlayScrollbars: true,
      plugins: true,
      experimentalFeatures: true,
      experimentalCanvasFeatures: true,
      webgl: true
		},
    show: false,
  }
  if(process.platform === 'linux') {
    options.icon = path.resolve(__dirname, '..', 'icons', 'mancy.png');
  }
  let mainWindow = new BrowserWindow(options);
  let id = mainWindow.id;
  windowCache[id] = mainWindow;
  let menuManager = menuManagerCache[id] = new MenuManager();

  mainWindow.loadURL(`file://${__dirname}/../index.html`);
  mainWindow.flashFrame(true);
  mainWindow.setTitle(`${_.capitalize(Config.name)} - REPL(${windowCount})`);
  windowCount += 1;

  mainWindow.on('closed',() => windowCache[id] = menuManagerCache[id] = null);
  mainWindow.on('close', onCloseWindow);
  mainWindow.on('focus', onFocusWindow);

  mainWindow.webContents.on('did-finish-load', () => {
    let totalActiveWindows = _.keys(windowCache).length;
    if(totalActiveWindows > 1) {
      let fixPos = (axis, adj) => {
        let naxis = axis + adj;
        return naxis <= 0 ? axis : naxis;
      };
      let [x, y] = mainWindow.getPosition();
      let adj = parseInt(Math.random() * 50) * (Math.random() > 0.3 ? -1: 1);
      let [nx, ny] = [fixPos(x, adj), fixPos(y, adj)];
      mainWindow.setPosition(nx, ny);
    }
    mainWindow.show();
    // Mac only
    if (process.platform === 'darwin') {
      mainWindow.showDefinitionForSelection(true);
      //mainWindow.setVisibleOnAllWorkspaces(true);
    }

    if(typeof fun === 'function') {
      fun(mainWindow);
    }
  });
}

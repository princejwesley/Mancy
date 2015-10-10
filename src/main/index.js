require('crash-reporter').start();
var app = require('app');
var BrowserWindow = require('browser-window');
var {MenuManager} = require('./MenuManager');
var Config = require('../package.json');
var _ = require('lodash');
var ipc = require('ipc');
var dialog = require('dialog');

var windowCache = {};
var menuManagerCache = {};
var windowCount = 0;

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', onReady);
app.on('activate-with-no-open-windows', onReady);

ipc.on('application:message-box', function(sender, options) {
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
});

function onReady() {
  var {width, height} = require('screen').getPrimaryDisplay().workAreaSize;

  let mainWindow = new BrowserWindow({
    width: width * 0.75,
    height: height * 0.75,
    'min-height': width * 0.5,
    'min-width': height * 0.5,
    resizable: true,
    'web-preferences': {
			'overlay-scrollbars': true,
      'plugins': true
		},
    show: false,
  });

  windowCache[mainWindow.id] = mainWindow;
  let menuManager = menuManagerCache[mainWindow.id] = new MenuManager();

  mainWindow.loadUrl('file://' + __dirname + '/../index.html');
  mainWindow.flashFrame(true);
  mainWindow.setTitle(`${_.capitalize(Config.name)} - REPL(${windowCount})`);
  windowCount += 1;

  mainWindow.on('closed', function() {
    delete windowCache[mainWindow.id];
    delete menuManagerCache[mainWindow.id];
  });

  mainWindow.webContents.on('did-finish-load', function() {
    let totalActiveWindows = _.keys(windowCache).length;
    if(totalActiveWindows > 1) {
      let fixPos = (axis, adj) => {
        let naxis = axis + adj;
        return naxis <= 0 ? axis : naxis;
      };
      let [x,y] = mainWindow.getPosition();
      let adj = parseInt(Math.random() * 50) * (Math.random() > 0.3 ? -1: 1);
      let [nx, ny] = [fixPos(x, adj), fixPos(y, adj)];
      mainWindow.setPosition(nx, ny);
    }
    mainWindow.show();
    mainWindow.focus();
    // Mac only
    if (process.platform === 'darwin') {
      mainWindow.showDefinitionForSelection(true);
      //mainWindow.setVisibleOnAllWorkspaces(true);
    }
  });

  menuManager.attachToWindow();
}

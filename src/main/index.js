// set node env as production to avoid react warnings leaking in our console window & explode
process.env.NODE_ENV = 'production';

var app = require('app');
var BrowserWindow = require('browser-window');
var {MenuManager} = require('./MenuManager');
var Config = require('../package.json');
var _ = require('lodash');

var windowCache = {};
var menuManagerCache = {};

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', onReady);
app.on('activate-with-no-open-windows', onReady);

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
  mainWindow.setTitle(`${_.capitalize(Config.name)} - REPL(${_.keys(windowCache).length - 1})`);

  mainWindow.on('closed', function() {
    delete windowCache[mainWindow.id];
    delete menuManagerCache[mainWindow.id];
  });

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    mainWindow.focus();
    // Mac only
    if (process.platform === 'darwin') {
      mainWindow.showDefinitionForSelection(true);
      //mainWindow.setVisibleOnAllWorkspaces(true);
    }
  });

  if(process.env.NODE_MANCY_DEV_MODE && process.env.NODE_MANCY_DEV_MODE === 'true') {
    mainWindow.openDevTools({detach: true});
  }

  menuManager.attachToWindow();
}

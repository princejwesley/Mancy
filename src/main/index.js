var app = require('app');
var BrowserWindow = require('browser-window');
var menu = require('./menu');

var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', onReady);
app.on('activate-with-no-open-windows', onReady);

function onReady() {

  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    resizable: true,
    'web-preferences': {
			'overlay-scrollbars': true
		},
    show: false,
    title: 'Node REPL+'
  });

  mainWindow.loadUrl('file://' + __dirname + '/../../index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    mainWindow.focus();
  });

  menu.setMenu(app, mainWindow);

  // testing
  mainWindow.openDevTools({detach: false});
}

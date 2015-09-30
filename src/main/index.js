// set node env as production to avoid react warnings leaking in our console window
// comment below code to test react warnings
process.env.NODE_ENV = 'production';


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
    width: 1000,
    height: 600,
    'min-height': 400,
    'min-width': 600,
    resizable: true,
    'web-preferences': {
			'overlay-scrollbars': true,
      'plugins': true
		},
    show: false,
    title: 'Mancy',
  });

  mainWindow.loadUrl('file://' + __dirname + '/../index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    mainWindow.focus();
  });

  menu.setMenu(app, mainWindow);

  // testing
  //TODO: configure for dev only environment
  mainWindow.openDevTools({detach: true});
}

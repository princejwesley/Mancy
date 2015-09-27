var Menu = require('menu');
var MenuItem = require('menu-item');

module.exports = {
  setMenu: function(app, mainWindow) {
    var template = [
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            selector: 'undo:'
          },
          {
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            selector: 'redo:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            selector: 'cut:'
          },
          {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            selector: 'copy:'
          },
          {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            selector: 'paste:'
          },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            selector: 'selectAll:'
          },
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload Mancy',
            accelerator: 'CmdOrCtrl+R',
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.reload();
            }
          },
          {
            label: 'Toggle Full Screen',
            accelerator: (function() {
              if (process.platform === 'darwin')
                return 'Ctrl+Command+F';
              else
                return 'F11';
            })(),
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          },
        ]
      },
      {
        label: 'Window',
        role: 'window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            selector: 'performMiniaturize:'
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            selector: 'performClose:'
          },
        ]
      },
      {
        label: 'Help',
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: function() { require('shell').openExternal('https://github.com/princejwesley/Mancy') }
          },
        ]
      },
    ];

    if (process.platform === 'darwin') {
      var name = 'Mancy';
      template.unshift({
        label: name,
        submenu: [
          {
            label: 'About ' + name,
            selector: 'orderFrontStandardAboutPanel:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          {
            type: 'separator'
          },
          {
            label: 'Hide ' + name,
            accelerator: 'Command+H',
            selector: 'hide:'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            selector: 'hideOtherApplications:'
          },
          {
            label: 'Show All',
            selector: 'unhideAllApplications:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() { app.quit(); }
          },
        ]
      });
      // Window menu.
      template[3].submenu.push(
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          selector: 'arrangeInFront:'
        }
      );
    }

    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
};

import _ from 'lodash';
import EventEmitter from 'events';
import Config from '../package.json';
import {join} from 'path';
import {Menu, app, MenuItem, dialog, BrowserWindow, shell, ipcMain} from 'electron';
import {readFileSync} from 'fs';
import GitHubApi from 'github';

let platformMenu = require(`../menus/${process.platform}.json`);
let noop = () => {};

export class MenuManager extends EventEmitter {

  constructor(argv) {
    super();
    this.argv = argv;
    _.each(['bindMenuItems', 'systemMenuItems', 'addImages', 'attachToWindow',
      'buildMenuSelectorActions', 'checkForUpdate', 'checkNewRelease'], (fun) => {
      this[fun] = this[fun].bind(this);
    });

    ipcMain.on('application:sync-preference', (sender, preferences)  => {
      let {mode, theme, lang, editor} = preferences;
      let menu = Menu.getApplicationMenu();
      // sync views, prompts
      let viewMenu = menu.items[process.platform === 'darwin' ? 3 : 2];
      let themeMenu = _.find(viewMenu.submenu.items, (item) => item.label === 'Theme');
      let promptMenu = menu.items[process.platform === 'darwin' ? 4 : 3];
      let langMenu = _.find(promptMenu.submenu.items, (item) => item.label === 'Language');
      let modeMenu = _.find(promptMenu.submenu.items, (item) => item.label === 'REPL Mode');
      let editorMenu = _.find(promptMenu.submenu.items, (item) => item.label === 'Editor Mode');
      _.find(modeMenu.submenu.items, (m) => m.label === mode).checked = true;
      _.find(editorMenu.submenu.items, (m) => m.label === editor).checked = true;
      _.find(langMenu.submenu.items, (m) => m.value === lang).checked = true;
      _.find(themeMenu.submenu.items, (t) => t.label === theme).checked = true;
    });

    ipcMain.on('application:check-new-release', ({sender})  => {
      if(this.latestRelease) {
        let release = this.latestRelease.release;
        if(`v${Config.version}` !== release) {
          sender.send('application:new-release', this.latestRelease);
        }
      }
    });
    this.attachToWindow();
  }

  attachToWindow() {
    this.menuSelectorActions = this.buildMenuSelectorActions();
    let menuTemplate = _.cloneDeep(platformMenu);
    this.bindMenuItems(menuTemplate);
    this.systemMenuItems(menuTemplate);
    this.addImages(menuTemplate);
    this.menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(this.menu);
  }

  checkForUpdate() {
    this.latestRelease = null;
    let releasePopup = () => {
      let options = {
        title: 'Check for Updates…',
        buttons: ['Close'],
        type: 'info',
      };

      if(this.latestRelease && `v${Config.version}` !== this.latestRelease.release) {
        options.buttons.push('Download');
        options.message = 'New updates available.';
        options.detail = `New version ${this.latestRelease.release.substring(1)} is available.`;
      } else {
        options.message = 'no updates available.';
        options.detail = `Version ${Config.version} is the latest version.`;
      }
      dialog.showMessageBox(null, options, (pos) => {
        if(pos === 1) {
          shell.openExternal(this.latestRelease.url);
        }
      });
    }
    this.checkNewRelease(releasePopup);
  }

  checkNewRelease(cb) {
    cb = cb ? cb : function() {};
    try {
      let api = new GitHubApi({
        version: "3.0.0"
      });
      api.releases.listReleases({
        owner: 'princejwesley',
        repo: 'Mancy'
      }, (err, data) => {
        if(err) { return cb(); }
        let {tag_name, assets} = data[0];
        let assetName = `Mancy-${process.platform}-${process.arch}.zip`;
        let asset = _.find(assets, (asset) => asset.name === assetName);
        if(asset) {
          this.latestRelease = {
            url: asset.browser_download_url,
            release: tag_name
          };
        }
        cb();
      });
    } catch(e) { cb(); }
  }

  buildMenuSelectorActions() {
    return {
      'application:new-window': this.openNewWindow,
      'application:add-path': this.openDirectoryAction,
      'application:export-file': this.saveFileAction,
      'application:import-file': this.openFileAction,
      'application:quit': this.quitApplication,
      'window:close': this.closeWindow,
      'window:reload': this.windowReload,
      'window:toggle-full-screen': this.toggleFullScreen,
      'window:toggle-always-on-top': this.toggleAlwaysOnTop,
      'application:minimize': this.minimizeWindow,
      'application:maximize': this.maximizeWindow,
      'application:open-license': this.showLicense,
      'application:open-documentation': this.openDocumentation,
      'application:report-issue': this.reportIssue,
      'application:about': this.aboutMancy,
      'application:check-update': this.checkForUpdate,
      'application:release-notes': this.releaseNotes,
      'application:save-as': this.saveFileAction,
      'application:load-file': this.openFileAction,
    };
  }

  bindMenuItems(menuItems) {
    for(let menuItem of menuItems) {

      if((menuItem.role && !menuItem.submenu)||
        menuItem.type === 'separator' ||
        menuItem.selector) {
        continue;
      }

      if(menuItem.submenu) {
        this.bindMenuItems(menuItem.submenu);
        continue;
      }
      menuItem.click = this.menuSelectorActions[menuItem.command] || this.forward;
    }
  }

  addImages(menuItems) {
    if(process.platform !== 'darwin') { return; }
    const nativeImage = require('electron').nativeImage;
    let promptMenu = menuItems[4];
    let langMenu = _.find(promptMenu.submenu, (item) => item.label === 'Language');
    _.each(langMenu.submenu, (menu) => {
      menu.icon = nativeImage.createFromPath(join(__dirname, '..', 'logos', `${menu.value}.png`))
    });
  }

  openNewWindow() {
    app.emit('ready', 'new-window');
  }

  forward(item, focusedWindow) {
    let callback = (browser) => browser.webContents.send(item.command, item.value);
    if(!focusedWindow) {
      let [window] = BrowserWindow.getAllWindows();
      if(!window) {
        app.emit('ready-action', callback);
      } else {
        window.show();
        callback(window);
      }
    }
    else { callback(focusedWindow); }
  }

  openDirectoryAction(item, focusedWindow) {
    if(!focusedWindow) { return; }
    let path = dialog.showOpenDialog(focusedWindow, {
      title: item,
      properties: [
        'openDirectory'
      ]
    });

    if(path) {
      focusedWindow.webContents.send(item.command, path);
    }
  }

  saveFileAction(item, focusedWindow) {
    if(!focusedWindow) { return; }
    let filename = dialog.showSaveDialog(focusedWindow, {
      title: item,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    if(filename) {
      focusedWindow.webContents.send(item.command, filename);
    }
  }

  openFileAction(item, focusedWindow) {
    if(!focusedWindow) { return; }
    let filename = dialog.showOpenDialog(focusedWindow, {
      title: item,
      filters: [{ name: 'All Files', extensions: ['*'] }],
      properties: [
        'openFile'
      ]
    });
    if(filename) {
      focusedWindow.webContents.send(item.command, filename[0]);
    }
  }

  windowReload(item, focus) {
    if(!focus) { return; }
    focus.reload();
  }

  toggleFullScreen(item, focusedWindow) {
    let isFullScreen = focusedWindow.isFullScreen();
    focusedWindow.setFullScreen(!isFullScreen);
  }

  toggleAlwaysOnTop(item, focusedWindow) {
    let flag = focusedWindow.isAlwaysOnTop();
    focusedWindow.setAlwaysOnTop(!flag);
  }

  quitApplication() {
    app.quit();
  }

  closeWindow(item, window) {
    window.close();
  }

  minimizeWindow(item, window) {
    window.minimize();
  }

  maximizeWindow(item, window) {
    window.maximize();
  }

  showLicense(item, focusedWindow) {
    let options = {
      title: 'About License',
      buttons: ['Close'],
      type: 'info',
      message: `${Config.license} License`,
      detail: readFileSync(`${__dirname}/../LICENSE`).toString('utf8')
    };
    dialog.showMessageBox(focusedWindow || null, options);
  }

  openDocumentation() {
    shell.openExternal(Config.homepage);
  }

  reportIssue() {
    shell.openExternal(Config.bugs.url);
  }

  releaseNotes() {
    shell.openExternal(`${Config.homepage}/blob/master/CHANGELOG.md`);
  }

  aboutMancy(item, focusedWindow) {
    let options = {
      title: 'About Mancy',
      buttons: ['Close'],
      type: 'info',
      message: `${Config.description} (v${Config.version})`,
      detail: `${Config.license} Copyright (c) 2015 ${Config.author}`
    };
    dialog.showMessageBox(focusedWindow || null, options);
  }

  systemMenuItems(menuItems) {
    if(this.argv.debug) {
      let devTools = {
        label: 'Toggle Developer Tools',
        accelerator: (() => process.platform == 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I')(),
        click: function(item, window) {
          if (window) {
            window.toggleDevTools();
          }
        }
      };
      // view menu
      let pos = process.platform == 'darwin' ? 3 : 2;
      let {submenu} = menuItems[pos];
      submenu.push(devTools);
    }
  }
}

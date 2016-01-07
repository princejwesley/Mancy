
import app from 'app';
import Menu from 'menu';
import dialog from 'dialog';
import MenuItem from 'menu-item';
import _ from 'lodash';
import EventEmitter from 'events';
import MancyApplication from './MancyApplication';
import Config from '../package.json';
import {join} from 'path';
import {ipcMain} from 'electron';

let platformMenu = require(`../menus/${process.platform}.json`);
let noop = () => {};

export class MenuManager extends EventEmitter {

  constructor() {
    super();
    _.each(['bindMenuItems', 'systemMenuItems', 'addImages',
      'buildMenuSelectorActions', 'checkForUpdate', 'checkNewRelease'], (fun) => {
      this[fun] = this[fun].bind(this);
    });

    ipcMain.on('application:sync-preference', (sender, preferences)  => {
      let {mode, theme, lang} = preferences;
      let menu = Menu.getApplicationMenu();
      // sync views, prompts
      let viewMenu = menu.items[process.platform === 'darwin' ? 3 : 2];
      let themeMenu = _.find(viewMenu.submenu.items, (item) => item.label === 'Theme');
      let promptMenu = menu.items[process.platform === 'darwin' ? 4 : 3];
      let langMenu = _.find(promptMenu.submenu.items, (item) => item.label === 'Language');
      let modeMenu = _.find(promptMenu.submenu.items, (item) => item.label === 'Mode');
      _.find(modeMenu.submenu.items, (m) => m.label === mode).checked = true;
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
  }

  attachToWindow() {
    this.mancyApplication = new MancyApplication();
    this.menuSelectorActions = this.buildMenuSelectorActions(this.mancyApplication);
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

  buildMenuSelectorActions(app) {
    return {
      'application:new-window': app.openNewWindow,
      'application:add-path': app.openDirectoryAction,
      'application:export-file': app.saveFileAction,
      'application:import-file': app.openFileAction,
      'application:quit': app.quitApplication,
      'window:close': app.closeWindow,
      'window:reload': app.windowReload,
      'window:toggle-full-screen': app.toggleFullScreen,
      'application:minimize': app.minimizeWindow,
      'application:maximize': app.maximizeWindow,
      'application:open-license': app.showLicense,
      'application:open-documentation': app.openDocumentation,
      'application:report-issue': app.reportIssue,
      'application:about': app.aboutMancy,
      'application:check-update': this.checkForUpdate,
      'application:release-notes': app.releaseNotes,
      'application:save-as': app.saveFileAction,
      'application:load-file': app.openFileAction,
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
      menuItem.click = this.menuSelectorActions[menuItem.command] || this.mancyApplication.forward;
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

  systemMenuItems(menuItems) {
    if(process.env.NODE_MANCY_DEV_MODE && process.env.NODE_MANCY_DEV_MODE === 'true') {
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

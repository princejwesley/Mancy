import app from 'app';
import BrowserWindow from 'browser-window';
import {readFileSync} from 'fs';
import dialog from 'dialog';
import {ipcMain} from 'electron';
import _ from 'lodash';
import Menu from 'menu';
import shell from 'shell';
import MenuManager from './MenuManager';
import EventEmitter from 'events';
import Config from '../package.json';
import GitHubApi from 'github';

export default class MancyApplication extends EventEmitter {
  constructor() {
    super();
    this.checkNewRelease();
    this.rendererEvents();
    this.checkForUpdate = this.checkForUpdate.bind(this);
  }

  openNewWindow() {
    app.emit('ready');
  }

  forward(item, focusedWindow) {
    if(!focusedWindow) { return; }
    focusedWindow.webContents.send(item.command, item.value);
  }

  addPath(item, focusedWindow) {
    if(!focusedWindow) { return; }
    let path = dialog.showOpenDialog(focusedWindow, {
      title: 'Add module path…',
      properties: [
        'openDirectory'
      ]
    });

    if(path) {
      focusedWindow.webContents.send('application:add-path', path);
    }
  }

  exportToFile(item, focusedWindow) {
    if(!focusedWindow) { return; }
    let filename = dialog.showSaveDialog(focusedWindow, {
      title: 'Save session to file…',
      filters: [
        { name: 'Json Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if(filename) {
      focusedWindow.webContents.send('application:export', filename);
    }
  }

  importFromFile(item, focusedWindow) {
    if(!focusedWindow) { return; }
    let filename = dialog.showOpenDialog(focusedWindow, {
      title: 'Load session from file…',
      filters: [
        { name: 'Json Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: [
        'openFile'
      ]
    });

    if(filename) {
      focusedWindow.webContents.send('application:import', filename[0]);
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

    dialog.showMessageBox(focusedWindow, options);
  }

  openDocumentation() {
    shell.openExternal(Config.homepage);
  }

  reportIssue() {
    shell.openExternal(Config.bugs.url);
  }

  aboutMancy(item, focusedWindow) {
    let options = {
      title: 'About Mancy',
      buttons: ['Close'],
      type: 'info',
      message: `${Config.description} (v${Config.version})`,
      detail: `${Config.license} Copyright (c) 2015 ${Config.author}`
    };

    dialog.showMessageBox(focusedWindow, options);
  }

  rendererEvents() {
    let listenToSyncPreference = () => {
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
    };

    let listenToCheckNewRelease = () => {
      ipcMain.on('application:check-new-release', ({sender})  => {
        if(this.latestRelease) {
          let release = this.latestRelease.release;
          if(`v${Config.version}` !== release) {
            sender.send('application:new-release', this.latestRelease);
          }
        }
      });
    };

    listenToSyncPreference();
    listenToCheckNewRelease();
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
}

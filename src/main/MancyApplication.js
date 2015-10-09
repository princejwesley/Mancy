import app from 'app';
import BrowserWindow from 'browser-window';
import {readFileSync} from 'fs';
import dialog from 'dialog';
import ipc from 'ipc';
import _ from 'lodash';
import Menu from 'menu';
import shell from 'shell';
import MenuManager from './MenuManager';
import EventEmitter from 'events';
import Config from '../package.json';

export default class MancyApplication extends EventEmitter {
  constructor() {
    super();
    
    ipc.on('application:sync-preference', (sender, preferences)  => {
      let {mode, theme} = preferences;
      let mainMenu = Menu.getApplicationMenu().items[0];
      let preferenceMenu = _.find(mainMenu.submenu.items, (item) => item.label === 'Preferences');
      let [modeMenu, themeMenu] = preferenceMenu.submenu.items;

      _.find(modeMenu.submenu.items, (m) => m.label === mode).checked = true;
      _.find(themeMenu.submenu.items, (t) => t.label === theme).checked = true;
    });
  }

  openNewWindow() {
    app.emit('ready');
  }

  preferences(item, focusedWindow) {
    focusedWindow.webContents.send(item.command);
  }

  promptClearAll(item, focusedWindow) {
    focusedWindow.webContents.send('application:prompt-clear-all');
  }

  promptCollapseAll(item, focusedWindow) {
    focusedWindow.webContents.send('application:prompt-collapse-all');
  }

  promptExpandAll(item, focusedWindow) {
    focusedWindow.webContents.send('application:prompt-expand-all');
  }

  promptBreak(item, focusedWindow) {
    focusedWindow.webContents.send('application:prompt-break');
  }

  promptFormat(item, focusedWindow) {
    focusedWindow.webContents.send('application:prompt-format');
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
      title: 'Export to File…',
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
      title: 'Import from File…',
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
    shell.openExternal(`${Config.homepage}`);
  }

  reportIssue() {
    shell.openExternal(`${Config.bugs.url}`);
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
}

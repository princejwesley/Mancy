import app from 'app';
import BrowserWindow from 'browser-window';
import {readFileSync} from 'fs';
import dialog from 'dialog';
import shell from 'shell';
import MenuManager from './MenuManager';
import EventEmitter from 'events';
import Config from '../package.json';

export default class MancyApplication extends EventEmitter {
  constructor() {
    super();
  }

  openNewWindow() {
    app.emit('ready');
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

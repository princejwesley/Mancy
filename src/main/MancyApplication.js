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
  }

  openNewWindow() {
    app.emit('ready');
  }

  forward(item, focusedWindow) {
    if(!focusedWindow) { return; }
    focusedWindow.webContents.send(item.command, item.value);
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

    dialog.showMessageBox(focusedWindow, options);
  }
}

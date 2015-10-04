
const app = require('app');
const BrowserWindow = require('browser-window');
const fs = require('fs');
const dialog = require('dialog');
const shell = require('shell');
import MenuManager from './MenuManager';
import EventEmitter from 'events';

export default class MancyApplication extends EventEmitter {
	constructor() {
		super();
	}

	openNewWindow() {
		console.log('Open New Window');
	}
	
	exportToFile() {
		console.log('Open New Window');
	}
	
	importFromFile() {
		console.log('Open New Window');
	}
	
	windowReload(item, focus) {
		focus.reload();
	}
	
	toggleFullScreen(item, focusedWindow) {
		console.log('Open toggleFullScreen Window');
		let isFullScreen = focusedWindow.isFullScreen();
		console.log('isFullScreen: ', isFullScreen);
		focusedWindow.setFullScreen(!isFullScreen);
	}

	quitApplication() {
		console.log('Quitting app');
		app.quit();
	}
	
	minimizeWindow(item, window) {
		window.minimize();
		console.log('Open minimizeWindow Window');
	}

	maximizeWindow(item, window) {
		console.log('minimizeWindow app');
		window.maximize();
	}

  showLicense(item, focusedWindow) {
    let options = {
      title: 'About License',
      buttons: ['Close'],
      type: 'info',
      message: 'MIT License',
      detail: 'The MIT License (MIT) Copyright (c) 2015 Emmanouil Konstantinidis'
    };

    dialog.showMessageBox(focusedWindow, options);
  }

  openDocumentation() {
  	console.log('openDocumentation app');
  	shell.openExternal('https://github.com');
  }

  reportIssue() {
  	console.log('reportIssue app');
  	shell.openExternal('https://github.com');
  }

  aboutMancy(item, focusedWindow) {
  	let options = {
      title: 'About Mancy',
      buttons: ['Close'],
      type: 'info',
      message: 'Javascript REPL',
      detail: 'The MIT License (MIT) Copyright (c) 2015 Emmanouil Konstantinidis'
    };
    
    dialog.showMessageBox(focusedWindow, options);

  }
}
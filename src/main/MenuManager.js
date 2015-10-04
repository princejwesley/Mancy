
const ipc = require('ipc');
const Menu = require('menu');
const MenuItem = require('menu-item');
const app = require('app');
const path = require('path');
import EventEmitter from 'events';
import MancyApplication from './MancyApplication';
let platformMenu = require(`../../menus/${process.platform}.json`);

let mancyApplication = null;
export class MenuManager extends EventEmitter {

	constructor(application) {
		super();
		this.bindMenuItems = this.bindMenuItems.bind(this);
		
	}

  attachToWindow() {
  	this.mancyApplication = new MancyApplication();
  	this.bindMenuItems(platformMenu);
    this.menu = Menu.buildFromTemplate(platformMenu);
    Menu.setApplicationMenu(this.menu);
  }

	bindMenuItems(menuItems) {
  	console.log('Inside bindMenuItems');
  	for (let menuItem of menuItems) {

  		if (menuItem.role !== undefined)
  			continue;

  		if (menuItem.type === 'separator') 
  			continue;

  		if (menuItem.submenu) {
  			this.bindMenuItems(menuItem.submenu);
  			continue;
  		}

  		let cmd = menuItem.command;
  		console.log('Command: ', cmd);
  		if (cmd === 'application:new-window') {
  			menuItem.click = this.mancyApplication.openNewWindow;
  		}
  		else if (cmd === 'application:export-file') {
  			menuItem.click = this.mancyApplication.exportToFile;
  		}
  		else if (cmd === 'application:import-file') {
  			menuItem.click = this.mancyApplication.importFromFile;
  		}
  		else if (cmd === 'application:quit') {
  			menuItem.click = this.mancyApplication.quitApplication;
  		}
  	 	else if (cmd === 'window:reload') {
  			menuItem.click = this.mancyApplication.windowReload;
  		}
  		else if (cmd === 'window:toggle-full-screen') {
  			menuItem.click = this.mancyApplication.toggleFullScreen;
  		}
  		else if (cmd === 'application:minimize') {
  			menuItem.click = this.mancyApplication.minimizeWindow;
  		}
      else if (cmd === 'application:maximize') {
        menuItem.click = this.mancyApplication.maximizeWindow;
      }
  		else if (cmd === 'application:open-license') {
  			menuItem.click = this.mancyApplication.showLicense;
  		}
  	 	else if (cmd === 'application:open-documentation') {
  			menuItem.click = this.mancyApplication.openDocumentation;
  		}
  		else if (cmd === 'application:report-issue') {
  			menuItem.click = this.mancyApplication.reportIssue;
  		}
  		else if (cmd === 'application:about') {
  			menuItem.click = this.mancyApplication.aboutMancy;
  		}
  	}
  }


}

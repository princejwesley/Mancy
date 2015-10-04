
import app from 'app';
import ipc from 'ipc';
import Menu from 'menu';
import MenuItem from 'menu-item';
import _ from 'lodash';
import EventEmitter from 'events';
import MancyApplication from './MancyApplication';
import Config from '../package.json';

let platformMenu = require(`../../menus/${process.platform}.json`);
let mancyApplication = null;
let noop = () => {};

export class MenuManager extends EventEmitter {

  constructor(application) {
    super();
    _.each(['bindMenuItems', 'systemMenuItems',
      'buildMenuSelectorActions', 'unhandledMenuItem'], (fun) => {
      this[fun] = this[fun].bind(this);
    });
  }

  attachToWindow() {
    this.mancyApplication = new MancyApplication();
    this.menuSelectorActions = this.buildMenuSelectorActions(this.mancyApplication);
    this.bindMenuItems(platformMenu);
    this.systemMenuItems(platformMenu);
    this.menu = Menu.buildFromTemplate(platformMenu);
    Menu.setApplicationMenu(this.menu);
  }

  buildMenuSelectorActions(app) {
    return {
      'application:new-window': app.openNewWindow,
      'application:export-file': app.exportToFile,
      'application:import-file': app.importFromFile,
      'application:quit': app.quitApplication,
      'window:close': app.closeWindow,
      'window:reload': app.windowReload,
      'window:toggle-full-screen': app.toggleFullScreen,
      'application:minimize': app.minimizeWindow,
      'application:maximize': app.maximizeWindow,
      'application:open-license': app.showLicense,
      'application:open-documentation': app.openDocumentation,
      'application:report-issue': app.reportIssue,
      'application:about': app.aboutMancy
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
      menuItem.click = this.menuSelectorActions[menuItem.command] || this.unhandledMenuItem(menuItem);
    }
  }
  unhandledMenuItem(menuItem) {
    console.error('UnHandled Menu Item', menuItem);
    return noop;
  }
  systemMenuItems() {

  }
}

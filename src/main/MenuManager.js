
import app from 'app';
import Menu from 'menu';
import dialog from 'dialog';
import MenuItem from 'menu-item';
import _ from 'lodash';
import EventEmitter from 'events';
import MancyApplication from './MancyApplication';
import Config from '../package.json';
import {join} from 'path';

let platformMenu = require(`../menus/${process.platform}.json`);
let noop = () => {};

export class MenuManager extends EventEmitter {

  constructor() {
    super();
    _.each(['bindMenuItems', 'systemMenuItems', 'addImages',
      'buildMenuSelectorActions'], (fun) => {
      this[fun] = this[fun].bind(this);
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
      'application:check-update': app.checkForUpdate,
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

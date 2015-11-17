import React from 'react';
import _ from 'lodash';
import ReplEntries from './ReplEntries';
import ReplPrompt from './ReplPrompt';
import ReplStatusBar from './ReplStatusBar';
import ReplStore from '../stores/ReplStore';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplDOM from '../common/ReplDOM';
import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import ReplPreferencesActions from '../actions/ReplPreferencesActions';
import ReplConsoleActions from '../actions/ReplConsoleActions';
import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import ReplStatusBarActions from '../actions/ReplStatusBarActions';
import Reflux from 'reflux';
import {ipcRenderer} from 'electron';
import {writeFile, readFile} from 'fs';
import remote from 'remote';
import ReplStreamHook from '../common/ReplStreamHook';
import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplConsole from './ReplConsole';
import ReplOutput from '../common/ReplOutput';
import ContextMenu from '../menus/context-menu.json';
import ReplConstants from '../constants/ReplConstants';
import ReplContext from '../common/ReplContext';
import ReplCommon from '../common/ReplCommon';
import ReplLanguages from '../languages/ReplLanguages';

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    _.each([
      'onStateChange', 'onPaste', 'onContextMenu',
      'onKeydown', 'onBreakPrompt', 'onClearCommands',
      'onCollapseAll', 'onExpandAll', 'onDrag', 'onToggleConsole', 'onFormatPromptCode',
      'onStdout', 'onStderr', 'onStdMessage', 'onConsole', 'onConsoleChange', 'getPromptKey',
      'onImport', 'onExport', 'onAddPath', 'loadPreferences',
      'checkNewRelease', 'onNewRelease', 'resizeWindow'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.loadPreferences();
    ReplCommon.addUserDataToPath(ReplContext.getContext());

    this.state = _.cloneDeep(ReplStore.getStore());
  }

  componentDidMount() {
    // set REPL language
    ReplLanguages.setREPL(global.Mancy.preferences.lang);
    this.setupContextMenu();
    this.activePromptKey = Date.now();

    //register events
    this.unsubscribe = ReplStore.listen(this.onStateChange);

    window.addEventListener('paste', this.onPaste, false);
    window.addEventListener('contextmenu', this.onContextMenu, false);
    window.addEventListener('keydown', this.onKeydown, false);

    // hooks
    ReplStreamHook.on('stdout', this.onStdout);
    ReplStreamHook.on('stderr', this.onStderr);
    ReplStreamHook.enable();

    ReplConsoleHook.on('console', this.onConsole);
    ReplConsoleHook.enable();

    ipcRenderer.on('application:import', this.onImport);
    ipcRenderer.on('application:export', this.onExport);
    ipcRenderer.on('application:add-path', this.onAddPath);

    ipcRenderer.on('application:prompt-clear-all', this.onClearCommands);
    ipcRenderer.on('application:prompt-expand-all', this.onExpandAll);
    ipcRenderer.on('application:prompt-collapse-all', this.onCollapseAll);
    ipcRenderer.on('application:prompt-break', this.onBreakPrompt);
    ipcRenderer.on('application:prompt-format', this.onFormatPromptCode);

    ipcRenderer.on('application:prompt-mode-magic', () => ReplStore.onSetREPLMode('Magic'));
    ipcRenderer.on('application:prompt-mode-sloppy', () => ReplStore.onSetREPLMode('Sloppy'));
    ipcRenderer.on('application:prompt-mode-strict', () => ReplStore.onSetREPLMode('Strict'));
    ipcRenderer.on('application:prompt-language', (sender, value) =>  {
      ReplLanguages.setREPL(value);
      ReplStatusBarActions.updateLanguage(value);
    });

    ipcRenderer.on('application:preferences', ReplPreferencesActions.openPreferences);

    ipcRenderer.on('application:preference-theme-dark', () => ReplPreferencesActions.setTheme('Dark Theme'));
    ipcRenderer.on('application:preference-theme-light', () => ReplPreferencesActions.setTheme('Light Theme'));

    ipcRenderer.on('application:view-theme-dark', () => document.body.className = 'dark-theme');
    ipcRenderer.on('application:view-theme-light', () => document.body.className = 'light-theme');

    ipcRenderer.on('application:new-release', this.onNewRelease);
    this.checkNewRelease();
    ReplStore.onSetREPLMode(global.Mancy.preferences.mode);
    ReplPreferencesActions.setTheme(global.Mancy.preferences.theme);

    this.resizeWindow();
  }

  resizeWindow() {
    let setSize = (w, h) => localStorage.setItem('window', JSON.stringify({ width: w, height: h }));
    let win = remote.getCurrentWindow();
    let lastWindow = JSON.parse(localStorage.getItem('window'));
    let [width, height] = win.getSize();
    if(!lastWindow) { setSize(width, height) }
    else {
      try {
        win.setSize(lastWindow.width, lastWindow.height);
      } catch(e) {}
    }
    win.on('resize', () => {
      let [width, height] = win.getSize();
      setSize(width, height);
    });
  }

  setupContextMenu() {
    let Menu = remote.require('menu');
    let contextMenu = _.cloneDeep(ContextMenu);
    let actionTemplates = [
      {
        label: 'Clear All',
        accelerator: 'Ctrl+L',
        click: this.onClearCommands
      },
      {
        label: 'Collapse All',
        accelerator: 'CmdOrCtrl+K',
        click: this.onCollapseAll
      },
      {
        label: 'Expand All',
        accelerator: 'CmdOrCtrl+E',
        click: this.onExpandAll
      },
      {
        label: 'Break Prompt',
        accelerator: 'Ctrl+D',
        click: this.onBreakPrompt
      },
      {
        label: 'Format',
        accelerator: 'Shift+Ctrl+F',
        click: this.onFormatPromptCode
      }
    ];

    _.each(actionTemplates, (template) => contextMenu.push(template));

    this.menu = Menu.buildFromTemplate(contextMenu);
  }

  componentWillUnmount() {
    this.unsubscribe();
    window.removeEventListener('paste', this.onPaste, false);
    window.removeEventListener('contextmenu', this.onContextMenu, false);
    window.removeEventListener('keydown', this.onKeydown, false);

    ReplStreamHook.removeListener('stdout', this.onStdout);
    ReplStreamHook.removeListener('stderr', this.onStderr);
    ReplStreamHook.disable();

    ReplConsoleHook.removeListener('console', this.onConsole);
    ReplConsoleHook.disable();
  }

  checkNewRelease() {
    setTimeout(() => ipcRenderer.send('application:check-new-release'), 2000);
  }

  loadPreferences() {
    let preferences = JSON.parse(localStorage.getItem('preferences'));
    ipcRenderer.send('application:sync-preference', preferences);
  }

  onNewRelease(release) {
    ReplStatusBarActions.newRelease(release);
  }

  onImport(filename) {
    readFile(filename, (err, data) => {
      if(!err) {
        try {
          let history = JSON.parse(data);
          if(!Array.isArray(history) || !_.every(history, (h) => typeof h === 'string')) {
            throw Error(`Invalid session file ${filename}`);
          }
          ReplActiveInputActions.playCommands(history);
          return;
        } catch(e) {
          err = e;
        }
      }

      ipcRenderer.send('application:message-box', {
        title: 'Load session error',
        buttons: ['Close'],
        type: 'error',
        message: err.toString()
      });
    });
  }

  onExport(filename) {
    let {history} = ReplStore.getStore();
    let data = JSON.stringify(_.map(history, (h) => h.plainCode));
    writeFile(filename, data, { encoding: ReplConstants.REPL_ENCODING }, (err) => {
      let options = { buttons: ['Close'] };
      if(err) {
        options = _.extend(options, {
          title: 'Export Error',
          type: 'error',
          message: err.name || ' Error',
          detail: err.toString()
        });
      } else {
        options = _.extend(options, {
          title: 'Session saved',
          type: 'info',
          message: `Session saved to ${filename}`
        });
      }
      ipcRenderer.send('application:message-box', options);
    });
  }

  onAddPath(paths) {
    ReplCommon.addToPath(paths, ReplContext.getContext());
  }

  onContextMenu(e) {
    e.preventDefault();
    this.menu.popup(remote.getCurrentWindow());
  }

  onPaste(e) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
    ReplSuggestionActions.removeSuggestion();
  }

  onKeydown(e) {
    if(ReplDOMEvents.isEnter(e)) {
      ReplDOM.scrollToEnd();
      return;
    }
    if(e.ctrlKey && ReplDOMEvents.isSpace(e)) {
      ReplActiveInputActions.performAutoComplete();
    }
  }

  onFormatPromptCode() {
    ReplActiveInputActions.formatCode();
  }

  onCollapseAll() {
    ReplStore.collapseAll();
  }

  onExpandAll() {
    ReplStore.expandAll();
  }

  onBreakPrompt() {
    ReplActiveInputActions.breakPrompt();
  }

  onClearCommands() {
    ReplStore.clearStore();
    ReplConsoleActions.clear();
  }

  onStateChange() {
    this.setState(ReplStore.getStore());
  }

  onDrag(e) {
    let replConsole = document.getElementsByClassName('repl-console')[0];
    let replContainerRight = document.getElementsByClassName('repl-container-right')[0];

    let {clientX} = e;
    let {width} = document.defaultView.getComputedStyle(replConsole);
    let initWidth = parseInt(width, 10);

    let startDrag = (e) => {
      let adj = e.clientX - clientX;
      replContainerRight.style.flex = '0 0  ' + (initWidth - adj) + 'px';
    }

    let stopDrag = (e) => {
      document.documentElement.removeEventListener('mousemove', startDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }

    document.documentElement.addEventListener('mousemove', startDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }

  onToggleConsole() {
    this.reloadPrompt = false;
    ReplStore.toggleConsole();
  }

  onStdMessage({data, encoding, fd}, type) {
    let {formattedOutput} = ReplOutput.some(data).highlight(data);
    ReplConsoleActions.addEntry({
      type: type,
      data: [formattedOutput]
    });
    this.onConsoleChange();
  }

  onStdout(msg) {
    this.onStdMessage(msg.data ? msg.data.toString() : msg, 'log');
  }

  onStderr(msg) {
    this.onStdMessage(msg.data ? msg.data.toString() : msg, 'error');
  }

  onConsole({type, data}) {
    if(data.length === 0) { return; }
    let results = _.reduce(data, function(result, datum) {
      let {formattedOutput} = ReplOutput.some(datum).highlight(datum);
      result.push(formattedOutput);
      return result;
    }, []);

    ReplConsoleActions.addEntry({
      type: type,
      data: results
    });
    this.onConsoleChange(type);
  }

  onConsoleChange(type) {
    let currentWindow = remote.getCurrentWindow();
    if(!currentWindow.$focus && process.platform === 'darwin') {
      ipcRenderer.send('application:dock-message-notification', currentWindow.id);
    }
    if(this.state.showConsole) { return; }
    ReplStore.showBell();
  }

  getPromptKey() {
    if(!this.state.reloadPrompt) {
      return this.activePromptKey;
    }
    this.activePromptKey = Date.now();
    return this.activePromptKey;
  }

  render() {
    // force to recreate ReplPrompt
    return (
      <div className='repl-container'>
        <div className='repl-container-left'>
          <div className='repl-header' key='header-left'></div>
          <ReplEntries entries={this.state.entries} />
          <ReplPrompt key={this.getPromptKey()}
            history={this.state.history}
            historyIndex={this.state.historyIndex}
            historyStaged={this.state.historyStaged}
            command={this.state.command}
            mode={this.state.mode}
            cursor= {this.state.cursor} />
        </div>
        {
          this.state.showConsole
            ? <div className='repl-container-right'>
                <div className='repl-header' key='header-right'></div>
                <div className="repl-console">
                  <div className="repl-console-resizeable" onMouseDown={this.onDrag}>
                    <span className='repl-console-drag-lines'> </span>
                  </div>
                  <ReplConsole />
                </div>
              </div>
            : null
        }

        <ReplStatusBar history={this.state.entries}
          mode={this.state.mode}
          showConsole={this.state.showConsole}
          showBell={this.state.showBell}
          onToggleConsole={this.onToggleConsole}/>
      </div>
    );
  }
}

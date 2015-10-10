import React from 'react';
import _ from 'lodash';
import ReplEntries from './ReplEntries';
import ReplPrompt from './ReplPrompt';
import ReplStatusBar from './ReplStatusBar';
import ReplStore from '../stores/ReplStore';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplDOM from '../common/ReplDOM';
import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import ReplConsoleActions from '../actions/ReplConsoleActions';
import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import Reflux from 'reflux';
import ipc from 'ipc';
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

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    _.each([
      'onStateChange', 'onPaste', 'onContextMenu',
      'onKeydown', 'onBreakPrompt', 'onClearCommands',
      'onCollapseAll', 'onExpandAll', 'onDrag', 'onToggleConsole', 'onFormatPromptCode',
      'onStdout', 'onStderr', 'onStdMessage', 'onConsole', 'onConsoleChange', 'getPromptKey',
      'onImport', 'onExport', 'onAddPath', 'updatePreferences', 'loadPreferences',
      'checkNewRelease', 'onNewRelease'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.loadPreferences();
    this.checkNewRelease();
    this.state = _.cloneDeep(ReplStore.getStore());
  }

  componentDidMount() {
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

    ipc.on('application:import', this.onImport);
    ipc.on('application:export', this.onExport);
    ipc.on('application:add-path', this.onAddPath);

    ipc.on('application:prompt-clear-all', this.onClearCommands);
    ipc.on('application:prompt-expand-all', this.onExpandAll);
    ipc.on('application:prompt-collapse-all', this.onCollapseAll);
    ipc.on('application:prompt-break', this.onBreakPrompt);
    ipc.on('application:prompt-format', this.onFormatPromptCode);

    ipc.on('application:prompt-mode-magic', () => ReplStore.setReplMode('REPL_MODE_MAGIC'));
    ipc.on('application:prompt-mode-sloppy', () => ReplStore.setReplMode('REPL_MODE_SLOPPY'));
    ipc.on('application:prompt-mode-strict', () => ReplStore.setReplMode('REPL_MODE_STRICT'));

    ipc.on('application:preference-mode-magic', () => this.updatePreferences({mode: 'Magic'}));
    ipc.on('application:preference-mode-sloppy', () => this.updatePreferences({mode: 'Sloppy'}));
    ipc.on('application:preference-mode-strict', () => this.updatePreferences({mode: 'Strict'}));

    ipc.on('application:preference-theme-dark', () => this.updatePreferences({theme: 'Dark Theme'}));
    ipc.on('application:preference-theme-light', () => this.updatePreferences({theme: 'Light Theme'}));

    ipc.on('application:view-theme-dark', () => document.body.className = 'dark-theme');
    ipc.on('application:view-theme-light', () => document.body.className = 'light-theme');

    ipc.on('application:new-release', this.onNewRelease);
  }

  setupContextMenu() {
    let Menu = remote.require('menu');
    let contextMenu = _.cloneDeep(ContextMenu);
    let actionTemplates = [
      {
        label: 'Clear All',
        accelerator: 'CmdOrCtrl+K',
        click: this.onClearCommands
      },
      {
        label: 'Collapse All',
        accelerator: 'CmdOrCtrl+L',
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
        accelerator: 'CmdOrCtrl+F',
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

  updatePreferences({mode, theme}) {
    let preferences = JSON.parse(localStorage.getItem('preferences') || "{}");
    if(mode) {
      ReplStore.setReplMode(`REPL_MODE_${mode.toUpperCase()}`);
      preferences = _.extend(preferences, {"mode": mode});
    }
    if(theme) {
      document.body.className = theme.toLowerCase().replace(/\s+/, '-');
      preferences = _.extend(preferences, {"theme": theme});
    }
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }

  checkNewRelease() {
    ipc.send('application:check-new-release');
  }

  loadPreferences() {
    let preferences = JSON.parse(localStorage.getItem('preferences') || JSON.stringify({ "mode": "Magic", "theme": "Dark Theme" }));
    this.updatePreferences(preferences);
    ipc.send('application:sync-preference', preferences);
  }

  onNewRelease(release) {
    ReplStore.setNewRelease(release);
  }

  onImport(filename) {
    readFile(filename, (err, data) => {
      if(!err) {
        try {
          let history = JSON.parse(data);
          if(!Array.isArray(history) || !_.every(history, (h) => typeof h === 'string')) {
            throw Error(`Invalid import file ${filename}`);
          }
          ReplStore.importHistory(history);
          return;
        } catch(e) {
          err = e;
        }
      }

      ipc.send('application:message-box', {
        title: 'Export Error',
        buttons: ['Close'],
        type: 'error',
        message: err.toString()
      });
    });
  }

  onExport(filename) {
    let {history} = ReplStore.getStore();
    let data = JSON.stringify(history);
    writeFile(filename, data, { encoding: ReplConstants.REPL_ENCODING }, (err) => {
      let options = { buttons: ['Close'] };
      if(err) {
        options = _.extend(options, {
          title: 'Export Error',
          type: 'error',
          message: err.name || 'Export Error',
          detail: err.toString()
        });
      } else {
        options = _.extend(options, {
          title: 'Export Success',
          type: 'info',
          message: `Exported to ${filename}`
        });
      }
      ipc.send('application:message-box', options);
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
    this.onStdMessage(msg, 'log');
  }

  onStderr(msg) {
    this.onStdMessage(msg, 'error');
  }

  onConsole({type, data}) {
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
      ipc.send('application:dock-message-notification', currentWindow.id);
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
          newRelease={this.state.newRelease}
          onToggleConsole={this.onToggleConsole}/>
      </div>
    );
  }
}

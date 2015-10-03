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
import remote from 'remote';
import ReplStreamHook from '../common/ReplStreamHook';
import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplConsole from './ReplConsole';
import ReplOutput from '../common/ReplOutput';
import ContextMenu from '../menus/context-menu.json';

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.cloneDeep(ReplStore.getStore());

    _.each([
      'onStateChange', 'onPaste', 'onContextMenu',
      'onKeydown', 'onBreakPrompt', 'onClearCommands',
      'onCollapseAll', 'onExpandAll', 'onDrag', 'onToggleConsole', 'onFormatPromptCode',
      'onStdout', 'onStderr', 'onStdMessage', 'onConsole', 'onConsoleChange', 'getPromptKey'
    ], (field) => {
      this[field] = this[field].bind(this);
    });
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
        accelerator: 'Ctrl+C',
        click: this.onBreakPrompt
      },
      {
        label: 'Format',
        accelerator: 'CmdOrCtrl+F',
        click: this.onFormatPromptCode
      },
      {
        type: 'separator'
      },
      {
        label: 'Mode',
        submenu: [{
          label: 'Sloppy',
          type: 'radio',
          click: () => { ReplStore.setReplMode('REPL_MODE_SLOPPY'); }
        },{
          label: 'Magic',
          type: 'radio',
          checked: true,
          click: () => { ReplStore.setReplMode('REPL_MODE_MAGIC'); }
        },{
          label: 'Strict',
          type: 'radio',
          click: () => { ReplStore.setReplMode('REPL_MODE_STRICT'); }
        }]
      },
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

    let { ctrlKey, shiftKey, metaKey, altKey, which } = e;

    // ctrl + c
    let C = "C".codePointAt(0);
    if( ctrlKey && !shiftKey && !metaKey && !altKey && which === C) {
      return this.onBreakPrompt();
    }

    // cmd + k or ctrl + k
    let K = "K".codePointAt(0);
    if(!shiftKey && !altKey && which === K && (ctrlKey ^ metaKey)) {
      return this.onClearCommands();
    }

    // cmd + e or ctrl + e
    let E = "E".codePointAt(0);
    if(!shiftKey && !altKey && which === E && (ctrlKey ^ metaKey)) {
      return this.onExpandAll();
    }

    // cmd + l or ctrl + l
    let L = "L".codePointAt(0);
    if(!shiftKey && !altKey && which === L && (ctrlKey ^ metaKey)) {
      return this.onCollapseAll();
    }

    // cmd + F or ctrl + F
    let F = "F".codePointAt(0);
    if(!shiftKey && !altKey && which === F && (ctrlKey ^ metaKey)) {
      return this.onFormatPromptCode();
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
    this.onConsoleChange();
  }

  onConsoleChange() {
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

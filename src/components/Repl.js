import React from 'react';
import _ from 'lodash';
import ReplEntries from './ReplEntries';
import ReplPrompt from './ReplPrompt';
import ReplStatus from './ReplStatus';
import ReplStore from '../stores/ReplStore';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplDOM from '../common/ReplDOM';
import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';
import remote from 'remote';

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      command: '',
      cursor: 0,
      historyIndex: -1,
      historyStaged: '',
    };
    this.onStateChange = this.onStateChange.bind(this);
    this.onPaste = this.onPaste.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onBreakPrompt = this.onBreakPrompt.bind(this);
    this.onClearCommands = this.onClearCommands.bind(this);
  }

  componentDidMount() {
    this.setupMenu();
    this.unsubscribe = ReplStore.listen(this.onStateChange);
    window.addEventListener('paste', this.onPaste, false);
    window.addEventListener('contextmenu', this.onContextMenu, false);
    window.addEventListener('keydown', this.onKeydown, false);
  }

  setupMenu() {
    let Menu = remote.require('menu');
    Repl.contextMenuTemplate.push({
      label: 'Clear All',
      accelerator: 'CmdOrCtrl+K',
      click: this.onClearCommands
    });
    Repl.contextMenuTemplate.push({
      label: 'Break Prompt',
      accelerator: 'Ctrl+C',
      click: this.onBreakPrompt
    });
    this.menu = Menu.buildFromTemplate(Repl.contextMenuTemplate);
  }

  componentWillUnmount() {
    this.unsubscribe();
    window.removeEventListener('paste', this.onPaste, false);
    window.removeEventListener('contextmenu', this.onContextMenu, false);
    window.removeEventListener('keydown', this.onKeydown, false);
  }

  onContextMenu(e) {
    e.preventDefault();
    this.menu.popup(remote.getCurrentWindow());
  }

  onPaste(e) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
  }

  onKeydown(e) {
    if(ReplDOMEvents.isEnter(e)) {
      ReplDOM.scrollToEnd();
      return;
    }

    let { ctrlKey, shiftKey, metaKey, altKey, which } = e;

    // TODO: compose predicates
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
  }

  onBreakPrompt() {
    ReplActiveInputActions.breakPrompt();
  }

  onClearCommands() {
    ReplStore.clearStore();
  }

  onStateChange() {
    this.setState(ReplStore.getStore());
  }

  render() {
    // force to recreate ReplPrompt
    return (
      <div className='repl-container'>
        <ReplEntries entries={this.state.entries} />
        <ReplPrompt key={Date.now()}
          history={this.state.entries}
          historyIndex={this.state.historyIndex}
          historyStaged={this.state.historyStaged}
          command={this.state.command}
          cursor= {this.state.cursor} />
        <div className="repl-status-bar-cover"> </div>
        <ReplStatus />
      </div>
    );
  }

  static contextMenuTemplate = [{
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      selector: 'undo:'
    },
    {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      selector: 'redo:'
    },
    {
      type: 'separator'
    },
    {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      selector: 'cut:'
    },
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      selector: 'copy:'
    },
    {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      selector: 'paste:'
    },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      selector: 'selectAll:'
    },
    {
      type: 'separator'
    },
  ];

}

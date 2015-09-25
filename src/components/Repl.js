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
import ReplStreamHooks from '../common/ReplStreamHooks';
import ReplConsole from '../common/ReplConsole';

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.cloneDeep(ReplStore.getStore());

    _.each([
      'onStateChange', 'onPaste', 'onContextMenu',
      'onKeydown', 'onBreakPrompt', 'onClearCommands',
      'onCollapseAll', 'onExpandAll', 'onDrag', 'onToggleConsole',
      'onStdout', 'onStderr', 'onConsole'
    ], (field) => {
      this[field] = this[field].bind(this);
    });
  }

  componentDidMount() {
    this.setupMenu();
    this.unsubscribe = ReplStore.listen(this.onStateChange);
    window.addEventListener('paste', this.onPaste, false);
    window.addEventListener('contextmenu', this.onContextMenu, false);
    window.addEventListener('keydown', this.onKeydown, false);

    // hooks
    ReplStreamHooks.on('stdout', this.onStdout);
    ReplStreamHooks.on('stderr', this.onStderr);
    ReplStreamHooks.enable();

    ReplConsole.on('any', this.onConsole);
    ReplConsole.enable();
  }

  setupMenu() {
    let Menu = remote.require('menu');
    Repl.contextMenuTemplate.push({
      label: 'Clear All',
      accelerator: 'CmdOrCtrl+K',
      click: this.onClearCommands
    });
    Repl.contextMenuTemplate.push({
      label: 'Collapse All',
      accelerator: 'CmdOrCtrl+L',
      click: this.onCollapseAll
    });
    Repl.contextMenuTemplate.push({
      label: 'Expand All',
      accelerator: 'CmdOrCtrl+E',
      click: this.onExpandAll
    });
    Repl.contextMenuTemplate.push({
      label: 'Break Prompt',
      accelerator: 'Ctrl+C',
      click: this.onBreakPrompt
    });
    Repl.contextMenuTemplate.push({
      type: 'separator'
    });
    Repl.contextMenuTemplate.push({
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
    });

    this.menu = Menu.buildFromTemplate(Repl.contextMenuTemplate);
  }

  componentWillUnmount() {
    this.unsubscribe();
    window.removeEventListener('paste', this.onPaste, false);
    window.removeEventListener('contextmenu', this.onContextMenu, false);
    window.removeEventListener('keydown', this.onKeydown, false);
    ReplStreamHooks.removeListener('stdout', this.onStdout);
    ReplStreamHooks.removeListener('stderr', this.onStderr);
    ReplStreamHooks.disable();
    ReplConsole.removeListener('any', this.onConsole);
    ReplConsole.disable();
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
    ReplStore.toggleConsole();
  }

  onStdout({data, encoding, fd}) {
  }

  onStderr({data, encoding, fd}) {

  }

  onConsole({type, data}) {
  }

  render() {
    // force to recreate ReplPrompt
    return (
      <div className='repl-container'>
        <div className='repl-container-left'>
          <div className='repl-header' key='header-left'></div>
          <ReplEntries entries={this.state.entries} />
          <ReplPrompt key={Date.now()}
            history={this.state.entries}
            historyIndex={this.state.historyIndex}
            historyStaged={this.state.historyStaged}
            command={this.state.command}
            mode={this.state.mode}
            cursor= {this.state.cursor} />
          <div className="repl-status-bar-cover" key='cover'></div>
        </div>
        {
          this.state.showConsole
            ? <div className='repl-container-right'>
                <div className='repl-header' key='header-right'></div>
                <div className="repl-console">
                  <div className="repl-console-resizeable" onMouseDown={this.onDrag}>
                    <span className='repl-console-drag-lines'> </span>
                  </div>
                  <div className='repl-console-message'>
                  </div>
                </div>
              </div>
            : null
        }

        <ReplStatus history={this.state.entries}
          mode={this.state.mode}
          showConsole={this.state.showConsole}
          onToggleConsole={this.onToggleConsole}/>
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

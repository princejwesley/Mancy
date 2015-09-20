import React from 'react';
import _ from 'lodash';
import ReplEntries from './ReplEntries';
import ReplPrompt from './ReplPrompt';
import ReplStatus from './ReplStatus';
import ReplStore from '../stores/ReplStore';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplDOM from '../common/ReplDOM';
import Reflux from 'reflux';
import remote from 'remote';

let Menu = remote.require('menu');
let MenuItem = remote.require('menu-item');

let template = [{
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
  {
    label: 'Clear All',
    accelerator: 'CmdOrCtrl+K'
  },
  {
    label: 'Break Prompt',
    accelerator: 'Ctrl+C'
  },
];

let menu = Menu.buildFromTemplate(template);

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      command: '',
      cursor: 0
    };
    this.onStateChange = this.onStateChange.bind(this);
    this.onPaste = this.onPaste.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = ReplStore.listen(this.onStateChange);
    window.addEventListener('paste', this.onPaste, false);
    window.addEventListener('contextmenu', this.onContextMenu, false);
    window.addEventListener('keydown', this.onKeydown, false);
  }

  componentWillUnmount() {
    this.unsubscribe();
    window.removeEventListener('paste', this.onPaste, false);
    window.removeEventListener('contextmenu', this.onContextMenu, false);
    window.removeEventListener('keydown', this.onKeydown, false);
  }

  onContextMenu(e) {
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
  }

  onPaste(e) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
  }

  onKeydown(e) {
    if(ReplDOMEvents.isEnter(e)) {
      ReplDOM.scrollToEnd();
    }
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
          command={this.state.command}
          cursor= {this.state.cursor} />
        <div className="repl-status-bar-cover"> </div>
        <ReplStatus />
      </div>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import ReplEntries from './ReplEntries';
import ReplPrompt from './ReplPrompt';
import ReplStatus from './ReplStatus';
import ReplStore from '../stores/ReplStore';
import Reflux from 'reflux';

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
  }

  componentDidMount() {
    this.unsubscribe = ReplStore.listen(this.onStateChange);
    window.addEventListener('paste', this.onPaste, false);
  }

  onPaste(e) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
  }

  componentWillUnmount() {
    this.unsubscribe();
    window.removeEventListener('paste', this.onPaste, false);
  }

  onStateChange() {
    this.setState(ReplStore.getStore());
  }

  render() {
    // force to recreate ReplPrompt

    return (
      <div className='repl-container'>
        <ReplEntries entries={this.state.entries} />
        <ReplPrompt key={Date.now()} command={this.state.command} cursor= {this.state.cursor}/>
        <div className="repl-status-bar-cover"> </div>
        <ReplStatus />
      </div>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import repl from 'repl';
import {Readable, Writable} from 'stream';
import {EOL} from 'os';
import ReplActions from '../actions/ReplActions';
import ReplConstants from '../constants/ReplConstants';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.initFocus();
    let cli = ReplActiveInput.getRepl();
    cli.output.write = this.addEntry.bind(this);
  }

  componentWillUnmount() {
    let cli = ReplActiveInput.getRepl();
    cli.output.write = () => {};
  }

  initFocus() {
    // focus/selection
    let node = React.findDOMNode(this);
    node.focus();
    let selection = window.getSelection();
    selection.collapse(node, 0);
  }

  addEntry(buf) {
    let entry = buf.toString();
    if(entry.length === 0) return;
    if(entry === '...') {
      console.log('continue ...')
    }
    console.log(entry)
  }

  onKeyDown(e) {
    console.log(this)
    let cli = ReplActiveInput.getRepl();
    if(e.key === 'Tab') {
      // cli.complete
    } else if(e.key === 'Enter') {
      const text = React.findDOMNode(this).innerText;
      cli.input.emit('data', text);
      cli.input.emit('data', EOL);
    }
    e.persist(); // remove after testing
    console.log(e)
  }
  render() {
    return (
      <div autoFocus className='repl-active-input' contentEditable={true} onKeyDown={this.onKeyDown.bind(this)}>
      </div>
    );
  }

  static getRepl = (() => {
    let readable = new Readable();
    let writable = new Writable();

    readable._read = writable.write = () => {};

    let nodeRepl = repl.start({
      prompt: '',
      input: readable,
      output: writable,
      terminal: false,
      useGlobal: false,
      ignoreUndefined: false,
      useColors: false,
      historySize: ReplConstants.REPL_HISTORY_SIZE,
      // writer: require('util').inspect,
      replMode: repl[ReplConstants.REPL_MODE],
    });
    // console.log(nodeRepl)

    // nodeRepl._domain.on('error', (err) => {
    //   console.log(err);
    // });

    return () => {
      return nodeRepl;
    };
  })();

}

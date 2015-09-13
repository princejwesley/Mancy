import React from 'react';
import _ from 'lodash';
import repl from 'repl';
import {Readable, Writable} from 'stream';
import {EOL} from 'os';
import shell from 'shell';
import ReplActions from '../actions/ReplActions';
import ReplConstants from '../constants/ReplConstants';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
    this.autoComplete = this.autoComplete.bind(this);
  }
  componentDidMount() {
    this.focus();
    let cli = ReplActiveInput.getRepl();
    cli.output.write = this.addEntry.bind(this);
  }

  componentWillUnmount() {
    let cli = ReplActiveInput.getRepl();
    cli.output.write = () => {};
  }

  focus() {
    // focus
    let node = React.findDOMNode(this);
    node.focus();

    //set cursor at end
    let range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  addEntry(buf) {
    let entry = buf.toString();
    if(entry.length === 0) return;
    if(entry === '...') {
      console.log('continue ...')
    }
    console.log(entry)
  }

  autoComplete(__, completion) {
    // console.log('auto complete', completion, this);
    let [list, input] = completion;
    if(list.length === 0) {
      shell.beep();
    } else if(list.length === 1) {
      const text = React.findDOMNode(this).innerText;
      let lines = text.split(EOL);
      let currentLine = lines.length - 1;
      lines[currentLine] = lines[currentLine].replace(input, '') + list[0];
      React.findDOMNode(this).innerText = lines.join(EOL);
    }
    this.focus()
  }

  onKeyDown(e) {
    let cli = ReplActiveInput.getRepl();
    const text = React.findDOMNode(this).innerText.trim();

    if(e.key === 'Tab') {
      cli.complete(text, this.autoComplete.bind(this));
      // avoid focus loss
      e.preventDefault();
    } else if(e.key === 'Enter') {
      // emit last line
      var lines = text.split(EOL);
      var lastLine = lines[lines.length - 1];
      cli.input.emit('data', lastLine);
      cli.input.emit('data', EOL);
    } else {
      // try autoComplete and show results too
    }
    // e.persist(); // remove after testing
    // console.log(e)
  }
  render() {
    return (
      <div autoFocus className='repl-active-input' tabIndex="-1" contentEditable={true} onKeyDown={this.onKeyDown.bind(this)}>
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

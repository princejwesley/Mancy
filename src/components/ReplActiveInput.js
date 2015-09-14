import React from 'react';
import _ from 'lodash';
import repl from 'repl';
import {Readable, Writable} from 'stream';
import {EOL} from 'os';
import shell from 'shell';
import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import ReplConstants from '../constants/ReplConstants';
import ReplType from '../common/ReplType';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
    this.onTabCompletion = this.onTabCompletion.bind(this);
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
    if(entry.length === 0 || entry === '...') return;
    console.log(entry);

  }

  autoComplete(__, completion) {
    let [list, ] = completion;
    let suggestions = _.map(list, (suggestion) => {
      return {
        type: ReplType.typeOf(suggestion),
        text: suggestion
      };
    });
    console.log(ReplSuggestionActions)
    if(suggestions.length) {
      ReplSuggestionActions.addSuggestion(suggestions);
    } else {
      ReplSuggestionActions.removeSuggestion();
    }
  }

  onTabCompletion(__, completion) {
    let [list, input] = completion;
    if(list.length === 0) {
      shell.beep();
      ReplSuggestionActions.removeSuggestion();
    } else if(list.length === 1) {
      const text = React.findDOMNode(this).innerText;
      let lines = text.split(EOL);
      let currentLine = lines.length - 1;
      lines[currentLine] = lines[currentLine].replace(input, '') + list[0];
      React.findDOMNode(this).innerText = lines.join(EOL);
      ReplSuggestionActions.removeSuggestion();
    } else {
      this.autoComplete(__, completion);
    }
    this.focus();
  }

  onKeyDown(e) {
    let cli = ReplActiveInput.getRepl();
    const text = React.findDOMNode(this).innerText.trim();

    if(e.key === 'Tab') {
      cli.complete(text, this.onTabCompletion);
      // avoid focus loss
      e.preventDefault();
    } else if(e.key === 'Enter') {
      // emit last line
      var lines = text.split(EOL);
      var lastLine = lines[lines.length - 1];
      cli.input.emit('data', lastLine);
      cli.input.emit('data', EOL);
    } else {
      cli.complete(text, this.autoComplete);
    }
    // e.persist(); // remove after testing
    // console.log(e)
  }
  render() {
    return (
      <div className='repl-active-input' tabIndex="-1" contentEditable={true} onKeyDown={this.onKeyDown.bind(this)}>
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

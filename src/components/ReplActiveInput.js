import React from 'react';
import _ from 'lodash';
import repl from 'repl';
import {Readable, Writable} from 'stream';
import {EOL} from 'os';
import shell from 'shell';
import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import ReplActions from '../actions/ReplActions';
import ReplConstants from '../constants/ReplConstants';
import ReplType from '../common/ReplType';
import ReplCommon from '../common/ReplCommon';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplDOM from '../common/ReplDOM';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
    this.onTabCompletion = this.onTabCompletion.bind(this);
    this.autoComplete = this.autoComplete.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }
  componentDidMount() {
    this.element = React.findDOMNode(this);
    this.element.innerText = this.props.command;
    this.focus();

    let cli = ReplActiveInput.getRepl();
    cli.output.write = this.addEntry.bind(this);
    //scroll to bottom
    ReplDOM.scrollToEnd();
  }

  componentWillUnmount() {
    let cli = ReplActiveInput.getRepl();
    cli.output.write = () => {};
  }

  focus() {
    // focus
    ReplDOM.focusOn(this.element);
    ReplDOM.moveCursorToEndOf(this.element);
  }

  addEntry(buf) {
    let entry = buf.toString() || '';
    if(entry.length === 0 || entry.match(/^\.+\s*$/)) { return; }
    let [exception, ...stackTrace] = entry.split(EOL);
    let status = (ReplCommon.isExceptionMessage(exception)
        && ReplCommon.isStackTrace(stackTrace));

    const text = this.element.innerText;
    ReplActions.addEntry({
      entry: entry,
      status: !status,
      command: ReplCommon.highlight(text),
      plainCode: text
    });
    ReplSuggestionActions.removeSuggestion();
  }

  autoComplete(__, completion) {
    let [list, ] = completion;
    let suggestions = _.chain(list)
      .filter((suggestion) => {
        return suggestion && suggestion.length !== 0;
      })
      .map((suggestion) => {
        return {
          type: ReplType.typeOf(suggestion),
          text: suggestion.replace(/^.*\./, '')
        };
      })
      .value();

    if(suggestions.length) {
      const text = this.element.innerText;
      ReplSuggestionActions.addSuggestion({suggestions: suggestions, input: text});
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
      const text = this.element.innerText;
      let lines = text.split(EOL);
      let currentLine = lines.length - 1;
      lines[currentLine] = lines[currentLine].replace(input, '') + list[0];
      this.element.innerText = lines.join(EOL);
      ReplSuggestionActions.removeSuggestion();
    } else {
      this.autoComplete(__, completion);
    }
    this.focus();
  }

  onKeyUp(e) {
    this.lastKey = e.key;

    if(ReplDOMEvents.isTab(e)
      || ReplDOMEvents.isEscape(e)
      || ReplDOMEvents.isKeyup(e)
      || ReplDOMEvents.isKeydown(e)
    ) {
      console.log('preventDefault')
      e.preventDefault();
      // e.stopPropagation();
      return;
    }

    console.log('key up', e)
    e.persist()

    let cli = ReplActiveInput.getRepl();
    const text = this.element.innerText.trim();
    if(ReplDOMEvents.isEnter(e)) {
      if(text.split(EOL).length > 1) {
        cli.input.emit('data', '.break');
        cli.input.emit('data', EOL);
      }
      cli.input.emit('data', text);
      cli.input.emit('data', EOL);
    } else {
      cli.complete(text, this.autoComplete);
    }
  }

  onKeyDown(e) {
    if( ReplDOMEvents.isKeyup(e)
      || ReplDOMEvents.isKeydown(e)
    ) {
      e.preventDefault();
      return;
    }
    if(!ReplDOMEvents.isTab(e)) { return; }

    let text = this.element.innerText || '';
    const lines = text.split(EOL);
    const lastLine = lines[lines.length - 1];

    if(!lastLine.trim().length && lines.length > 1) {
      if(this.lastKey === 'Enter' && !lastLine.length) {
        text = lines.slice(0, lines.length - 1).join(EOL);
      }
      this.element.innerText = [text, ReplCommon.times(ReplConstants.TAB_WIDTH, ' ')].join('');
      this.focus();
      ReplDOM.scrollToEnd();
    }

    let cli = ReplActiveInput.getRepl();
    cli.complete(text, this.onTabCompletion);
    // avoid focus loss
    e.preventDefault();
  }
  render() {
    return (
      <pre className='repl-active-input' tabIndex="-1" contentEditable={true}
        onKeyUp={this.onKeyUp}
        onKeyDown={this.onKeyDown}>
      </pre>
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
      // needed for better auto completion
      useGlobal: true,
      ignoreUndefined: false,
      useColors: false,
      historySize: ReplConstants.REPL_HISTORY_SIZE,
      replMode: repl[ReplConstants.REPL_MODE],
    });

    return () => {
      return nodeRepl;
    };
  })();

}

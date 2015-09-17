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
import ReplUtil from '../common/ReplUtil';
import ReplDOMUtil from '../common/ReplDOMUtil';

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
    ReplDOMUtil.scrollToEnd();
  }

  componentWillUnmount() {
    let cli = ReplActiveInput.getRepl();
    cli.output.write = () => {};
  }

  focus() {
    // focus
    ReplDOMUtil.focusOn(this.element);
    ReplDOMUtil.moveCursorToEndOf(this.element);
  }

  addEntry(buf) {
    let entry = buf.toString() || '';
    if(entry.length === 0 || entry.match(/^\.+\s*$/)) { return; }
    let [exception, ...stackTrace] = entry.split(EOL);
    let status = (ReplUtil.isExceptionMessage(exception)
        && ReplUtil.isStackTrace(stackTrace));

    const text = this.element.innerText;
    ReplActions.addEntry({
      entry: entry,
      status: !status,
      command: ReplUtil.highlight(text),
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
      console.log('cursor position', ReplDOMUtil.getAutoCompletePosition());
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
    //TODO: filter navigation keys too.
    if(ReplActiveInput.isTab(e)
      || ReplActiveInput.isEscape(e)
      || ReplActiveInput.isKeyup(e)
      || ReplActiveInput.isKeydown(e)
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // console.log('key up', e)
    // e.persist()

    let cli = ReplActiveInput.getRepl();
    const text = this.element.innerText.trim();
    if(ReplActiveInput.isEnter(e)) {
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
    if(!ReplActiveInput.isTab(e)) { return; }

    let text = this.element.innerText || '';
    const lines = text.split(EOL);
    const lastLine = lines[lines.length - 1];

    if(!lastLine.trim().length && lines.length > 1) {
      if(this.lastKey === 'Enter' && !lastLine.length) {
        text = lines.slice(0, lines.length - 1).join(EOL);
      }
      this.element.innerText = [text, ReplUtil.times(ReplConstants.TAB_WIDTH, ' ')].join('');
      this.focus();
      ReplDOMUtil.scrollToEnd();
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
  // TODO: move events in events Util
  static isTab(e) {
    return e.key === 'Tab';
  }

  static isEnter(e) {
    return e.key === 'Enter';
  }

  static isEscape(e) {
    return e.key === 'Escape';
  }

  static isKeyup(e) {
    return e.key === 'Up' || e.key === 'ArrowDown' || e.which === 38
  }

  static isKeydown(e) {
    return e.key === 'Down' || e.key === 'ArrowDown' || e.which === 40
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

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
import ReplActiveInputStore from '../stores/ReplActiveInputStore';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
    this.onTabCompletion = this.onTabCompletion.bind(this);
    this.autoComplete = this.autoComplete.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onTabCompleteSuggestion = this.onTabCompleteSuggestion.bind(this);
    this.waitingForOutput = false;

  }
  componentDidMount() {
    this.unsubscribe = ReplActiveInputStore.listen(this.onTabCompleteSuggestion);
    this.element = React.findDOMNode(this);
    this.focus();

    let cli = ReplActiveInput.getRepl();
    cli.output.write = this.addEntry.bind(this);
    //scroll to bottom
    ReplDOM.scrollToEnd();
  }

  componentWillUnmount() {
    this.unsubscribe();
    let cli = ReplActiveInput.getRepl();
    cli.output.write = () => {};
  }

  focus() {
    // focus
    ReplDOM.focusOn(this.element);
    ReplDOM.setCursorPosition(this.props.cursor || 0, this.element);
  }

  onTabCompleteSuggestion(suggestion) {}

  addEntry(buf) {
    if(!this.waitingForOutput) { return; }
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
      // no beep, only tab width spaces
      //shell.beep();
      let command = this.element.innerText + ReplCommon.times(ReplConstants.TAB_WIDTH, ' ');

      ReplSuggestionActions.removeSuggestion();
      ReplActions.reloadPrompt({
        command: command,
        cursor: command.length
      });

    } else if(list.length === 1) {
      this.onSelectTabCompletion(list[0]);
    } else {
      this.autoComplete(__, completion);
    }
  }

  onSelectTabCompletion(suggestion) {

    let breakReplaceWord = (word) => {
      let length = word.length;
      let rword = ReplCommon.reverseString(word);
      //extract prefix
      let prefix = ReplCommon.reverseString(rword.replace(/^\w+/, ''));
      return { prefix: prefix, suffix: word.substring(prefix.length) };
    }

    const text = this.element.innerText.replace(/\s*$/, '');

    let cursorPosition = ReplDOM.getCursorPosition();
    let left = text.substring(0, cursorPosition);
    let right = text.substring(cursorPosition);
    let {prefix, suffix} = breakReplaceWord(left);
    left = prefix + suggestion.substring(suggestion.indexOf(suffix));

    // console.log('left', left, 'right', right)
    // console.log([right.length, left.length])

    ReplSuggestionActions.removeSuggestion();
    ReplActions.reloadPrompt({ command: left + right, cursor: left.length});
  }

  onKeyUp(e) {
    this.lastKey = e.key;

    if(ReplDOMEvents.isTab(e)
      || ReplDOMEvents.isEscape(e)
      || ReplDOMEvents.isNavigation(e)
    ) {
      e.preventDefault();
      return;
    }
    // console.log('key up', e)
    // e.persist()

    let cli = ReplActiveInput.getRepl();
    const text = this.element.innerText.replace(/\s{1,2}$/, '');
    if(ReplDOMEvents.isEnter(e)) {
      this.waitingForOutput = true;
      cli.input.emit('data', '.break');
      cli.input.emit('data', EOL);

      cli.input.emit('data', text);
      cli.input.emit('data', EOL);
    } else {
      this.complete(text, this.autoComplete);
    }
  }

  onKeyDown(e) {
    if( ReplDOMEvents.isKeyup(e)
      || ReplDOMEvents.isKeydown(e)
    ) {
      // avoid system behavior
      e.preventDefault();

      // TODO: change cursor position manually
      // TODO: if it is a empty div, traverse history up
      return;
    }
    if(!ReplDOMEvents.isTab(e)) { return; }
    e.preventDefault();

    let activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
    if(activeSuggestion) {
      this.onSelectTabCompletion(activeSuggestion.input + activeSuggestion.expect);
    } else {
      let text = this.element.innerText || '';
      let cursor = ReplDOM.getCursorPosition();
      let words = ReplCommon.toWords(text.substring(0, cursor));
      this.complete(words.pop(), this.onTabCompletion);
    }
  }

  complete(code, callback) {
    let cli = ReplActiveInput.getRepl();
    this.waitingForOutput = false;
    ReplSuggestionActions.removeSuggestion();
    cli.complete(code, callback);
  }

  render() {
    return (
      <pre className='repl-active-input' tabIndex="-1" contentEditable={true}
        onKeyUp={this.onKeyUp}
        onKeyDown={this.onKeyDown}>
        {this.props.command}
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

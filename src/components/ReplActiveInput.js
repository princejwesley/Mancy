import React from 'react';
import _ from 'lodash';
import repl from 'repl';
import util from 'util';
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

    this.history = {
      // read-only
      log: this.props.history,
      idx: this.props.historyIndex,
      staged: this.props.historyStaged
    };

    _.each([
      'onTabCompletion', 'autoComplete', 'onKeyDown',
      'onKeyUp', 'onStoreChange', 'prompt',
      'addEntry', 'removeSuggestion'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.waitingForOutput = false;
    this.commandOutput = [];
    this.activeSuggestion = null;
    this.commandReady = false;
  }
  componentDidMount() {
    this.unsubscribe = ReplActiveInputStore.listen(this.onStoreChange);
    this.element = React.findDOMNode(this);
    this.focus();

    let cli = ReplActiveInput.getRepl();
    //set desired repl mode
    cli.replMode = repl[this.props.mode];
    //bind write handle
    cli.output.write = this.addEntry.bind(this);
    //scroll to bottom
    ReplDOM.scrollToEnd();

    //Hack: override display prompt
    this.displayPrompt = cli.displayPrompt;
    cli.displayPrompt = this.prompt;
  }

  componentWillUnmount() {
    this.unsubscribe();
    let cli = ReplActiveInput.getRepl();
    cli.output.write = () => {};
    cli.displayPrompt = this.displayPrompt;
  }

  focus() {
    // focus
    ReplDOM.focusOn(this.element);
    ReplDOM.setCursorPosition(this.props.cursor || 0, this.element);
  }

  onStoreChange() {
    let {now, activeSuggestion, breakPrompt} = ReplActiveInputStore.getStore();
    this.activeSuggestion = activeSuggestion
    if(breakPrompt) {
      let cli = ReplActiveInput.getRepl();
      this.waitingForOutput = false;
      cli.input.emit('data', '.break');
      cli.input.emit('data', EOL);
      this.reloadPrompt('', 0);
    }
    else if(now && activeSuggestion) {
      this.onSelectTabCompletion(activeSuggestion.input + activeSuggestion.expect);
    }
  }

  prompt(preserveCursor) {
    if(this.commandReady) {
      let cli = ReplActiveInput.getRepl();
      let output = this.commandOutput.join('');
      let [exception, ...stackTrace] = this.commandOutput;
      let status = (ReplCommon.isExceptionMessage(exception)
          && ReplCommon.isStackTrace(stackTrace));

      const text = this.element.innerText;
      ReplActions.addEntry({
        output: output,
        status: !status,
        command: ReplCommon.highlight(text),
        plainCode: text
      });

      this.removeSuggestion();
      this.commandOutput = [];
      this.commandReady = false;
    }
  }

  addEntry(buf) {
    if(!this.waitingForOutput) { return; }
    let output = buf.toString() || '';
    if(output.length === 0) { return; }

    this.commandReady = true;
    this.commandOutput.push(output)
  }

  autoComplete(__, completion) {
    let completeEntry = (suggestions, text) => {
      return suggestions.length != 1 || text.replace(/^.*\./,'') !== suggestions[0].text;
    };
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

    const text = this.element.innerText;
    if(suggestions.length && completeEntry(suggestions, text)) {
      ReplSuggestionActions.addSuggestion({suggestions: suggestions, input: text});
    } else {
      this.removeSuggestion();
    }
  }

  removeSuggestion() {
    // if(!this.suggestions.length) { return;}
    this.activeSuggestion = null;
    ReplSuggestionActions.removeSuggestion();
  }

  reloadPrompt(cmd, cursor, idx = -1, staged = '') {
    this.removeSuggestion();
    ReplActions.reloadPrompt({
      command: cmd,
      cursor: cursor,
      historyIndex: idx,
      historyStaged: (idx === -1 ? cmd : staged)
    });
  }

  onTabCompletion(__, completion) {
    let [list, input] = completion;
    if(list.length === 0) {
      // no beep, only tab width spaces
      //shell.beep();
      let command = this.element.innerText + ReplCommon.times(ReplConstants.TAB_WIDTH, ' ');
      this.reloadPrompt(command, command.length);
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

    let cursorPosition = this.lastSelectedRange.endOffset;
    let left = text.substring(0, cursorPosition);
    let right = text.substring(cursorPosition);
    let {prefix, suffix} = breakReplaceWord(left);
    left = prefix + suggestion.substring(suggestion.indexOf(suffix));

    this.reloadPrompt(left + right, left.length);
  }

  onKeyUp(e) {
    this.lastSelectedRange = window.getSelection().getRangeAt(0).cloneRange();

    if(ReplDOMEvents.isTab(e)
      || ReplDOMEvents.isEscape(e)
      || ReplDOMEvents.isNavigation(e)
    ) {
      e.preventDefault();
      return;
    }

    let cli = ReplActiveInput.getRepl();
    const text = this.element.innerText.replace(/\s{1,2}$/, '');
    if(ReplDOMEvents.isEnter(e)) {
      this.removeSuggestion();
      this.waitingForOutput = true;
      // allow user to code some more
      if(e.shiftKey) { return; }
      if(cli.bufferedCommand.length) {
        cli.input.emit('data', '.break');
        cli.input.emit('data', EOL);
      }
      cli.input.emit('data', text);
      cli.input.emit('data', EOL);
    } else {
      this.complete(text, this.autoComplete);
    }
  }

  onKeyDown(e) {
    this.lastSelectedRange = window.getSelection().getRangeAt(0).cloneRange();
    if( ReplDOMEvents.isKeyup(e)
      || ReplDOMEvents.isKeydown(e)
    ) {
      // avoid system behavior
      e.preventDefault();
      if(this.activeSuggestion) return;
      let up = ReplDOMEvents.isKeyup(e);
      let success = ReplDOM.moveCursorUp(up, this.element);
      if(!success) { this.traverseHistory(up); }
      return;
    }

    if(ReplDOMEvents.isEnter(e) && !e.shiftKey) {
      const text = this.element.innerText;
      if(text.indexOf(EOL) === -1) {
        // move cursor to end before talk to REPL
        ReplDOM.setCursorPosition(text.length);
      }
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

  traverseHistory(up) {
    let len = this.history.log.length;
    if(!len) { return; }
    let idx = this.history.idx;
    if(idx === -1) {
      this.history.staged = this.element.innerText;
      idx = len;
    }
    idx = idx + (up ? -1 : 1);

    let navigateHistory = (up, cmd, pos) => {
      let code = cmd.trim();
      let cursorPosition = up ? cmd.indexOf(EOL) : code.length;
      if(cursorPosition < 0) { cursorPosition = 0; }
      this.reloadPrompt(code, cursorPosition, pos,(pos === -1 ? '' : this.history.staged));
    };

    (len <= idx || idx < 0)
      ? navigateHistory(up, this.history.staged, -1)
      : navigateHistory(up, this.history.log[idx].plainCode, idx);
  }

  complete(code, callback) {
    let cli = ReplActiveInput.getRepl();
    this.waitingForOutput = false;
    this.removeSuggestion();
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
      // needed to handle console separately and to avoid security policy error
      useGlobal: true,
      ignoreUndefined: false,
      useColors: false,
      writer: (obj, opt) => {
        // depth: null is dangerous
        // return util.inspect(obj, {depth: null});
        return util.inspect(obj, opt);
      },
      historySize: ReplConstants.REPL_HISTORY_SIZE,
      replMode: repl['REPL_MODE_MAGIC'],
    });

    return () => {
      return nodeRepl;
    };
  })();

}

import React from 'react';
import _ from 'lodash';
import util from 'util';
import ReplContext from '../common/ReplContext';
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
import ReplOutput from '../common/ReplOutput';
import ReplInput from '../common/ReplInput';

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
      'addEntry', 'removeSuggestion', 'onBlur', 'addEntryAction'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.waitingForOutput = false;
    this.commandOutput = [];
    this.activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
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
    ReplDOM.scrollToEnd(this.element);

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

  onBlur() {
    setTimeout(() => this.removeSuggestion(), 200);
  }

  onStoreChange() {
    let { now, activeSuggestion, breakPrompt,
          format, stagedCommands } = ReplActiveInputStore.getStore();
    this.activeSuggestion = activeSuggestion;
    if(format) {
      const text = this.element.innerText;
      if(text.length) {
        const formattedCode =  ReplCommon.format(this.element.innerText);
        this.reloadPrompt(formattedCode, formattedCode.length);
      }
    }
    else if(breakPrompt) {
      let cli = ReplActiveInput.getRepl();
      this.waitingForOutput = false;
      cli.input.emit('data', '.break');
      cli.input.emit('data', EOL);
      this.reloadPrompt('', 0);
    }
    else if(stagedCommands.length) {
      let cli = ReplActiveInput.getRepl();
      this.waitingForOutput = true;
      cli.input.emit('data', ReplInput.transform(stagedCommands[0]));
      cli.input.emit('data', EOL);
    }
    else if(now && activeSuggestion) {
      this.onSelectTabCompletion(activeSuggestion.input + activeSuggestion.expect);
    }
  }

  addEntryAction(formattedOutput, status, command, plainCode) {
    ReplActions.addEntry({
      formattedOutput: formattedOutput,
      status: status,
      command: command,
      plainCode: plainCode,
    });
  }

  prompt(preserveCursor) {
    let cli = ReplActiveInput.getRepl();
    let addEntryAction = (formattedOutput, error, text) => {
      this.addEntryAction(formattedOutput, !error, ReplCommon.highlight(text), text);
      this.removeSuggestion();
      this.commandOutput = [];
      this.promptInput = this.replFeed = null;
      this.commandReady = false;
    };

    let playStagedCommand = () => {
      let {stagedCommands} = ReplActiveInputStore.getStore();
      const text = stagedCommands.length ? stagedCommands[0] : ReplCommon.trimRight(this.element.innerText);
      if(stagedCommands.length) {
        ReplActiveInputStore.tailStagedCommands();
      }
    };

    if(cli.bufferedCommand.indexOf(this.replFeed) != -1) {
      let {formattedOutput} = cli.$lastExpression.highlight(global.Mancy.REPLError.stack);
      addEntryAction(formattedOutput, true, this.promptInput);
      playStagedCommand();
    }
    else if(cli.bufferedCommand.length === 0 && this.commandReady) {
      let output = this.commandOutput.join('');
      let {formattedOutput, error} = cli.$lastExpression.highlight(output);
      if(!this.replFeed) {
        ReplActions.overrideLastOutput(formattedOutput, !error);
        return;
      }
      addEntryAction(formattedOutput, error, this.promptInput);
      playStagedCommand();
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
      return suggestions.length != 1 || !text.endsWith(suggestions[0].text);
    };
    let [list, ] = completion;
    let suggestions = _.chain(ReplCommon.sortTabCompletion(ReplActiveInput.getRepl().context, list))
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
    let cursor = ReplDOM.getCursorPositionRelativeTo(this.element);
    let code = text.substring(0, cursor);
    if(suggestions.length && completeEntry(suggestions, code)) {
      if(code === '.') {
        suggestions.push({
          type: ReplType.typeOf('source'),
          text: 'source'
        });
      }
      ReplSuggestionActions.addSuggestion({suggestions: suggestions, input: code});
    } else {
      this.removeSuggestion();
    }
  }

  removeSuggestion() {
    setTimeout(() => ReplSuggestionActions.removeSuggestion(), 200);
  }

  reloadPrompt(cmd, cursor, idx = -1, staged = '') {
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
      const text = this.element.innerText;
      let cursor = ReplDOM.getCursorPositionRelativeTo(this.element);
      let [lcode, rcode] = ReplCommon.divide(text, cursor);
      let command = lcode + ReplCommon.times(ReplConstants.TAB_WIDTH, ' ') + rcode;
      this.reloadPrompt(command, cursor + ReplConstants.TAB_WIDTH);
      this.removeSuggestion();
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
      let escapedKeys = ReplCommon.escapseRegExp(suggestion.replace(/[\w\s]+/g, ''));
      let pattern = new RegExp(`^[\\w${escapedKeys}]+`);
      let prefix = ReplCommon.reverseString(rword.replace(pattern, ''));
      return { prefix: prefix, suffix: word.substring(prefix.length) };
    }

    const text = this.element.innerText.replace(/\s*$/, '');
    let cursorPosition = ReplDOM.getCursorPositionRelativeTo(this.element);
    let [left, right] = ReplCommon.divide(text, cursorPosition);
    let {prefix, suffix} = breakReplaceWord(left);
    left = prefix + suggestion.substring(suggestion.indexOf(suffix));
    this.reloadPrompt(left + right, left.length);
    this.removeSuggestion();
  }

  onKeyUp(e) {
    if(e.ctrlKey || e.metaKey || e.altKey) { return; }
    if( ReplDOMEvents.isKeyup(e)
      || ReplDOMEvents.isKeydown(e)
    ) {
      if(this.activeSuggestion) {
        e.preventDefault();
        return;
      };
    }

    this.lastSelectedRange = window.getSelection().getRangeAt(0).cloneRange();
    if(ReplDOMEvents.isTab(e)
      || ReplDOMEvents.isEscape(e)
      || ReplDOMEvents.isNavigation(e)
    ) {
      this.removeSuggestion();
      e.preventDefault();
      return;
    }

    if(ReplDOMEvents.isEnter(e)) {
      let activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
      if(activeSuggestion) {
        e.preventDefault();
        return;
      }
      this.waitingForOutput = true;
      // allow user to code some more
      ReplDOM.scrollToEnd();
      if(e.shiftKey) { return; }

      let cli = ReplActiveInput.getRepl();
      const text = this.element.innerText.replace(/\s{1,2}$/, '');
      if(cli.bufferedCommand.length) {
        cli.input.emit('data', '.break');
        cli.input.emit('data', EOL);
      }
      cli.$lastExpression = ReplOutput.none();
      this.promptInput = text;
      let {local, output, input} = ReplInput.transform(text);

      if(local) {
        return this.addEntryAction(output, true, input, text);
      }

      this.replFeed = output;
      cli.input.emit('data', this.replFeed);
      cli.input.emit('data', EOL);
    } else if(this.element.innerText.trim()){
      this.complete(this.autoComplete);
    } else {
      this.removeSuggestion();
    }
  }

  onKeyDown(e) {
    if(e.ctrlKey || e.metaKey || e.altKey) { return; }
    this.lastSelectedRange = window.getSelection().getRangeAt(0).cloneRange();

    let activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
    if(ReplDOMEvents.isEnter(e) && activeSuggestion) {
      e.stopPropagation();
      e.preventDefault();
      this.onSelectTabCompletion(activeSuggestion.input + activeSuggestion.expect);
      return;
    }

    if( ReplDOMEvents.isKeyup(e)
      || (ReplDOMEvents.isKeydown(e))
    ) {
      if(this.activeSuggestion) {
        e.preventDefault();
        return;
      };

      let up = ReplDOMEvents.isKeyup(e);
      let elementText = this.element.innerText;
      let pos = ReplDOM.getCursorPositionRelativeTo(this.element);
      let [left, right] = ReplCommon.divide(elementText, pos);
      let str = up ? left : right;
      if(str.indexOf(EOL) === -1) {
        this.traverseHistory(up);
        e.preventDefault();
      }
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
    if(activeSuggestion) {
      this.onSelectTabCompletion(activeSuggestion.input + activeSuggestion.expect);
    } else if(this.element.innerText.length){
      this.complete(this.onTabCompletion);
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
      let cursorPosition = !up ? cmd.indexOf(EOL) : code.length;
      if(cursorPosition < 0) { cursorPosition = 0; }
      this.reloadPrompt(code, cursorPosition, pos,(pos === -1 ? '' : this.history.staged));
    };

    (len <= idx || idx < 0)
      ? navigateHistory(up, this.history.staged, -1)
      : navigateHistory(up, this.history.log[idx].plainCode, idx);
  }

  complete(callback) {
    let text = this.element.innerText || '';
    let cursor = ReplDOM.getCursorPositionRelativeTo(this.element);
    let code = text.substring(0, cursor);
    let cli = ReplActiveInput.getRepl();
    this.waitingForOutput = false;
    cli.complete(code, callback);
  }

  render() {
    return (
      <div className='repl-active-input' tabIndex="-1" contentEditable={true}
        onKeyUp={this.onKeyUp}
        onKeyDown={this.onKeyDown}
        onBlur={this.onBlur}>
        {this.props.command}
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
      writer: (obj, opt) => {
        nodeRepl.$lastExpression = ReplOutput.some(obj);
        // link context
        nodeRepl.context = ReplContext.getContext();
        return '<<response>>';
      },
      historySize: ReplConstants.REPL_HISTORY_SIZE,
      replMode: repl['REPL_MODE_MAGIC'],
    });

    // here is our sandbox environment
    nodeRepl.context = ReplContext.createContext();
    ReplContext.unlinkContext(() => { nodeRepl.context = {}; });


    return () => {
      return nodeRepl;
    };
  })();

}

import React from 'react';
import _ from 'lodash';
import util from 'util';
import ReplContext from '../common/ReplContext';
import {EOL} from 'os';
import shell from 'shell';
import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import ReplActions from '../actions/ReplActions';
import ReplConstants from '../constants/ReplConstants';
import ReplType from '../common/ReplType';
import ReplCommon from '../common/ReplCommon';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplDOM from '../common/ReplDOM';
import ReplUndo from '../common/ReplUndo';
import ReplActiveInputStore from '../stores/ReplActiveInputStore';
import ReplOutput from '../common/ReplOutput';
import ReplInput from '../common/ReplInput';
import ReplLanguages from '../languages/ReplLanguages';

const BLOCK_SCOPED_ERR_MSG = 'Block-scoped declarations (let, const, function, class) not yet supported outside strict mode';

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
      'onTabCompletion', 'autoComplete', 'onKeyDown', 'onClick',
      'onKeyUp', 'onStoreChange', 'prompt', 'setDebouncedComplete',
      'addEntry', 'removeSuggestion', 'onBlur', 'addEntryAction',
      'onUndoRedo', 'onKeyPress', 'autoFillCharacters', 'insertCharacter',
      'shouldTranspile', 'talkToREPL', 'transpileAndExecute', 'ignoreCharacters',
      'canRetry'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
    this.commandReady = false;
    // retry on error for magic mode
    this.retried = false;
    this.setDebouncedComplete();
    this.undoManager = new ReplUndo();
  }

  componentDidMount() {
    this.unsubscribe = ReplActiveInputStore.listen(this.onStoreChange);
    this.element = React.findDOMNode(this);
    this.focus();

    let cli = ReplLanguages.getREPL();
    //set desired repl mode
    cli.replMode = ReplLanguages.getREPLProvider()[`REPL_MODE_${(global.Mancy.session.mode || global.Mancy.session.mode).toUpperCase()}`];
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
    let cli = ReplLanguages.getREPL();
    cli.output.write = () => {};
    cli.displayPrompt = this.displayPrompt;
  }

  setDebouncedComplete() {
    this.debouncedComplete = _.debounce(
      () => this.complete(this.autoComplete),
      global.Mancy.preferences.suggestionDelay
    );
  }

  focus() {
    // focus
    ReplDOM.focusOn(this.element);
    ReplDOM.setCursorPositionRelativeTo(this.props.cursor || 0, this.element);
  }

  onBlur() {
    setTimeout(() => this.removeSuggestion(), 200);
  }

  onClick() {
    setTimeout(() => this.removeSuggestion(), 200);
  }

  onUndoRedo({undo, redo}, type) {
    let {html, cursor} = type === ReplUndo.Undo ? undo : redo;
    this.removeSuggestion();
    this.element.innerHTML = html;
    ReplDOM.setCursorPositionRelativeTo(cursor, this.element);
  }

  onStoreChange() {
    let { now, activeSuggestion, breakPrompt,
          format, stagedCommands, autoComplete } = ReplActiveInputStore.getStore();
    this.activeSuggestion = activeSuggestion;
    this.setDebouncedComplete();

    if(autoComplete) {
      this.complete(this.autoComplete);
      return;
    }

    if(format) {
      const text = this.element.innerText;
      if(text.length) {
        const formattedCode =  ReplCommon.format(this.element.innerText);
        this.reloadPrompt(formattedCode, formattedCode.length);
      }
      return;
    }

    if(breakPrompt) {
      let cli = ReplLanguages.getREPL();
      cli.input.emit('data', '.break');
      cli.input.emit('data', EOL);
      this.reloadPrompt('', 0);
      return;
    }

    if(stagedCommands.length) {
      let cli = ReplLanguages.getREPL();
      this.promptInput = stagedCommands[0];
      let {local, output, input} = ReplInput.transform(stagedCommands[0]);

      cli.$lastExpression = ReplOutput.none();
      cli.context = ReplContext.getContext();

      if(local) {
        this.addEntryAction(output, true, input, stagedCommands[0]);
        ReplActiveInputStore.tailStagedCommands();
        return;
      }

      this.replFeed = output;
      cli.input.emit('data', this.replFeed);
      cli.input.emit('data', EOL);
      return;
    }

    if(now && activeSuggestion) {
      this.onSelectTabCompletion(activeSuggestion.input + activeSuggestion.expect);
      return;
    }
  }

  addEntryAction(formattedOutput, status, command, plainCode, transpiledOutput) {
    let addReplEntry = (output, formatted = false) => {
      // handle ctrl + c
      if(this.done) { return; }
      this.element.className = 'repl-active-input';
      formattedOutput = formatted ? output : ReplOutput.some(output).highlight().formattedOutput;
      ReplActions.addEntry({
        formattedOutput,
        status,
        command,
        plainCode,
        transpiledOutput
      });
      this.removeSuggestion();
      this.promptInput = this.replFeed = null;
      this.commandReady = this.force = false;
    };

    if(this.force && formattedOutput && formattedOutput.then) {
      formattedOutput.then(addReplEntry).catch(addReplEntry);
    } else {
      addReplEntry(formattedOutput, true);
    }
  }

  prompt(preserveCursor) {
    let cli = ReplLanguages.getREPL();
    let addEntryAction = (formattedOutput, error, text) => {
      this.addEntryAction(formattedOutput, !error, ReplCommon.highlight(text), text);
    };

    let playStagedCommand = () => {
      let {stagedCommands} = ReplActiveInputStore.getStore();
      if(stagedCommands.length) {
        ReplActiveInputStore.tailStagedCommands();
      }
    };

    if(cli.bufferedCommand.indexOf(this.replFeed) != -1 && global.Mancy.REPLError) {
      let {formattedOutput} = cli.$lastExpression.highlight(global.Mancy.REPLError.stack);
      addEntryAction(formattedOutput, true, this.promptInput);
      playStagedCommand();
    }
    else if(cli.bufferedCommand.length === 0 && this.commandReady) {
      let {formattedOutput, error} = this.force ? { formattedOutput: cli.$lastExpression.getValue() } : cli.$lastExpression.highlight(this.commandOutput);
      if(!this.replFeed) {
        ReplActions.overrideLastOutput(formattedOutput, !error);
        return;
      }
      addEntryAction(formattedOutput, error, this.promptInput);
      playStagedCommand();
    }
  }

  addEntry(buf) {
    let output = buf.toString() || '';
    if(output.length === 0 || output.indexOf('at REPLServer.complete') !== -1) { return; }
    this.commandOutput = null;
    if(output.trim() !== '<<response>>') {
      this.commandOutput = output;
    }

    if(!this.promptInput && this.commandOutput) {
      console.error(new Error(this.commandOutput));
      this.commandOutput = null;
    } else {
      this.commandReady = true;
    }
  }

  autoComplete(__, completion, kinds) {
    let completeEntry = (suggestions, text) => {
      return suggestions.length != 1 || !text.endsWith(suggestions[0].text);
    };
    let [list, completeOn] = completion;
    let suggestions = _.chain(_.zip(ReplCommon.sortTabCompletion(ReplLanguages.getREPL().context, list), kinds))
      .filter((zipped) => {
        return zipped[0] && zipped[0].length !== 0;
      })
      .map((zipped) => {
        return {
          type: ReplType.typeOf(zipped[1] ? zipped[1] : zipped[0]),
          text: zipped[0].replace(/^.*\./, ''),
          completeOn: completeOn.replace(/^.*\./, '')
        };
      })
      .value();

    if(!document.activeElement.isSameNode(this.element)) { return; }

    const text = this.element.innerText;
    let cursor = ReplDOM.getCursorPositionRelativeTo(this.element);
    let code = text.substring(0, cursor);
    if(suggestions.length && completeEntry(suggestions, code)) {
      if(code === '.') {
        suggestions.push({
          type: ReplType.typeOf('source'),
          text: 'source',
          completeOn: ""
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
    this.done = true;
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

  insertCharacter(pos, ch) {
    let text = this.element.innerText;
    this.element.innerText = text.slice(0, pos) + ch + text.slice(pos);
  }

  autoFillCharacters(e, pos) {
    if(!global.Mancy.preferences.autoCloseSymbol || ReplDOMEvents.isBackSpace(e)) { return; }
    let text = this.element.innerText;
    let ch = text[pos - 1];
    let open = ['[', '(', '{'];
    let close = [']', ')', '}'];
    let idx = open.indexOf(ch);

    if(idx !== -1) { this.insertCharacter(pos, close[idx]); }
    else if((pos === 1 || (text[pos - 2] !== ch && '\\' !== text[pos - 2])) && /['"`]/.test(ch)) { this.insertCharacter(pos, ch); }
  }

  ignoreCharacters(e) {
    if(!global.Mancy.preferences.autoCloseSymbol) { return false; }
    let pos = ReplDOM.getCursorPositionRelativeTo(this.element);
    let text = this.element.innerText;
    let ignoreList = [ ']', ')', '}', "'", '"', '`' ];
    if(!pos || ReplDOMEvents.isBackSpace(e) || ignoreList.indexOf(text[pos]) === -1 || text.length === pos) { return false; }

    let open = text[pos - 1];
    let close = text[pos];

    if(ReplDOMEvents.autoCloseKeyIdentifiers[close] !== e.nativeEvent.keyIdentifier) { return false; }
    let left = text.substring(0, pos);
    let counter = new RegExp(`[^${ReplDOMEvents.autoFillPairCharacters[close]}]+`, 'g');

    if(left.replace(counter, '').length % 2) {
      e.preventDefault();
      e.stopPropagation();
      ReplDOM.setCursorPositionRelativeTo(pos + 1, this.element);
      return true;
    }
    return false;
  }

  shouldTranspile() {
    return global.Mancy.preferences.transpile &&
      (global.Mancy.session.lang !== 'js' ||
        (global.Mancy.session.lang === 'js' && global.Mancy.preferences.babel))
  }

  canRetry(e) {
    return e && e.message && !this.retried
      && global.Mancy.session.mode === 'Magic'
      && global.Mancy.session.lang === 'js'
      && e.message === BLOCK_SCOPED_ERR_MSG
      && (this.retried = true);
  }

  transpileAndExecute(err, result) {
    let text = this.promptInput;
    if(err) {
      if(this.canRetry(err)) { this.talkToREPL(true); }
      else {
        this.addEntryAction(ReplOutput.some(err).highlight().formattedOutput,
          !err, ReplCommon.highlight(text), text);
      }
    } else {
      ReplCommon.runInContext(result, (err, output) => {
        if(err && this.canRetry(err)) { this.talkToREPL(true); }
        else {
          let {formattedOutput} = this.force && !err ? { 'formattedOutput': output } : ReplOutput.some(err || output).highlight();
          let transpiledOutput = !this.shouldTranspile() ? null : ReplOutput.transpile(result);
          this.addEntryAction(formattedOutput, !err, ReplCommon.highlight(text), text, transpiledOutput);
        }
      });
    }
  }

  talkToREPL(forceStrict = false) {
    let cli = ReplLanguages.getREPL();
    // managed by us (no react)
    this.element.className += ' repl-active-input-running';

    setTimeout(() => {
      const text = this.element.innerText.replace(/\s{1,2}$/, '');
      if(cli.bufferedCommand.length) {
        cli.input.emit('data', '.break');
        cli.input.emit('data', EOL);
      }
      cli.$lastExpression = ReplOutput.none();
      cli.context = ReplContext.getContext();
      this.promptInput = text;
      let {local, output, input, force} = ReplInput.transform(text);
      let out = output;
      this.force = !!force;

      if(local) {
        return this.addEntryAction(output, true, input, text);
      }

      if(forceStrict || global.Mancy.session.mode === 'Strict') { output = `'use strict'; void 0; ${output}` }

      if(!text.match(/^\s*\.load/)) {
        if(global.Mancy.session.lang !== 'js') {
          cli.transpile(output, cli.context, this.transpileAndExecute);
        } else {
          this.transpileAndExecute(_.isError(out) ? out : null, out);
        }
        return;
      }

      this.replFeed = output;
      cli.input.emit('data', this.replFeed);
      cli.input.emit('data', EOL);
    }, 17);
  }

  onKeyUp(e) {
    if((e.keyCode == 16) || e.ctrlKey || e.metaKey || e.altKey || (e.keyCode == 93) || (e.keyCode == 91)) { return; }
    if( ReplDOMEvents.isKeyup(e)
      || ReplDOMEvents.isKeydown(e)
    ) {
      if(this.activeSuggestion) {
        e.preventDefault();
        return;
      };
    }

    if(ReplDOMEvents.isTab(e)
      || ReplDOMEvents.isEscape(e)
      || ReplDOMEvents.isNavigation(e)
    ) {
      if(!ReplDOMEvents.isTab(e)) { this.removeSuggestion(); }
      e.preventDefault();
      return;
    }

    if(!ReplDOMEvents.isEnter(e) && this.element.innerText === this.lastText) { return; }
    this.lastText = this.element.innerText;

    if(ReplDOMEvents.isEnter(e)) {
      this.removeSuggestion();
      if (!e.shiftKey && global.Mancy.preferences.toggleShiftEnter) return;

      let activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
      if(activeSuggestion && global.Mancy.preferences.autoCompleteOnEnter) {
        e.preventDefault();
        return;
      }

      // allow user to code some more
      ReplDOM.scrollToEnd();
      if(e.shiftKey && !global.Mancy.preferences.toggleShiftEnter) { return; }

      this.talkToREPL();
    } else {
      if((!global.Mancy.preferences.toggleAutomaticAutoComplete &&
          ReplCommon.shouldTriggerAutoComplete(e) &&
          this.element.innerText.trim()) ||
          ReplActiveInputStore.getStore().activeSuggestion) {
        this.debouncedComplete();
      } else {
        this.removeSuggestion();
      }

      let pos = ReplDOM.getCursorPositionRelativeTo(this.element);
      this.autoFillCharacters(e, pos);
      if(!this.keyPressFired) { return; }

      this.element.innerHTML = ReplCommon.highlight(this.element.innerText);
      this.undoManager.add({
        undo: { html: this.lastEdit || '', cursor: this.lastCursorPosition || 0},
        redo: { html: this.element.innerHTML, cursor: pos},
      }, this.onUndoRedo);
      ReplDOM.setCursorPositionRelativeTo(pos, this.element);
      this.lastCursorPosition = pos;
      this.lastEdit = this.element.innerHTML;
    }
  }

  onKeyPress(e) {
    this.keyPressFired = true;
  }

  onKeyDown(e) {
    // execution in process
    if(this.ignoreCharacters(e) ||
      this.element.className !== 'repl-active-input' && !(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) {
      e.preventDefault();
      return;
    }
    if(this.keyPressFired && ((e.metaKey && !e.ctrlKey) || (!e.metaKey && e.ctrlKey)) && e.keyCode == 90) {
      // undo
      e.shiftKey ? this.undoManager.redo() : this.undoManager.undo();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.keyPressFired = false;

    if((e.keyCode == 16) || e.ctrlKey || e.metaKey || e.altKey || (e.keyCode == 93) || (e.keyCode == 91)) { return; }

    let activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
    if(ReplDOMEvents.isEnter(e) && activeSuggestion && global.Mancy.preferences.autoCompleteOnEnter) {
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

    if(ReplDOMEvents.isEnter(e) && (
      (!e.shiftKey && !global.Mancy.preferences.toggleShiftEnter) ||
      (e.shiftKey && global.Mancy.preferences.toggleShiftEnter)
    )) {
      const text = this.element.innerText;
      if(text.trim().length === 0) {
        e.preventDefault();
        return;
      }
      if(text.indexOf(EOL) === -1) {
        // move cursor to end before talk to REPL
        ReplDOM.setCursorPositionRelativeTo(text.length, this.element);
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
    if(!document.activeElement.isSameNode(this.element)) { return; }
    let text = this.element.innerText || '';
    let cursor = ReplDOM.getCursorPositionRelativeTo(this.element);
    let code = text.substring(0, cursor);
    let cli = ReplLanguages.getREPL();
    ReplSuggestionActions.removeSuggestion();
    if(ReplCommon.shouldTriggerAutoComplete(code.slice(code.length - 1))) {
      cli.complete(code, callback);
    }
  }

  render() {
    return (
      <div className='repl-active-input' tabIndex="-1" contentEditable={true}
        onKeyUp={this.onKeyUp}
        onClick={this.onClick}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
        onBlur={this.onBlur} dangerouslySetInnerHTML={{__html:ReplCommon.highlight(this.props.command)}}>
      </div>
    );
  }
}

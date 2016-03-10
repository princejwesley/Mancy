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
import ReplActiveInputStore from '../stores/ReplActiveInputStore';
import ReplOutput from '../common/ReplOutput';
import ReplInput from '../common/ReplInput';
import ReplLanguages from '../languages/ReplLanguages';

import CodeMirror from 'codemirror';

const remote = require('electron').remote;
const Menu = remote.Menu;

// modes
const modes = ['javascript', 'coffeescript', 'livescript']
modes.forEach( mode => require(`../node_modules/codemirror/mode/${mode}/${mode}.js`))

// keymaps
const keymaps = ['sublime', 'emacs', 'vim']
keymaps.forEach( keymap => require(`../node_modules/codemirror/keymap/${keymap}.js`))

// addons
const addons = [
	'selection/active-line', 'selection/mark-selection',
	'selection/selection-pointer', 'edit/matchbrackets',
	'search/match-highlighter', 'edit/closebrackets',
	'fold/foldcode', 'fold/foldgutter',
	'fold/brace-fold', 'fold/comment-fold',
	'fold/indent-fold', 'fold/markdown-fold',
	'comment/comment', 'comment/continueComment'
]
addons.forEach( addon => require(`../node_modules/codemirror/addon/${addon}.js`))

const BLOCK_SCOPED_ERR_MSG = 'Block-scoped declarations (let, const, function, class) not yet supported outside strict mode';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
    this.history = {
      // read-only
      log: this.props.history || [],
      idx: this.props.historyIndex,
      staged: this.props.historyStaged
    };

    this.contextCode = _.chain(this.history.log)
      .filter(l => l.status)
      .map(l => l.plainCode.split('\n'))
      .flatten()
      .value();

    _.each([
      'onTabCompletion', 'autoComplete', 'onKeyDown', 'onCursorActivity',
      'onKeyUp', 'onStoreChange', 'prompt', 'setDebouncedComplete',
      'addEntry', 'removeSuggestion', 'onBlur', 'addEntryAction',
      'shouldTranspile', 'transpileAndExecute',
      'canRetry', 'onInputRead', 'onKeyTab', 'onKeyEnter',
      'onKeyShiftEnter', 'onRun', 'execute', 'onPerformAutoComplete',
      'onChange', 'onTriggerAction', 'onSetEditorOption',
      'onContextmenu', 'getPopupMenu', 'onFormat', 'onFoldAll', 'onUnFoldAll',
      'foldUnfoldAll', 'isREPLMode', 'resetSuggestionTimer', 'getHistorySuggession',
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.commandReady = false;
    // retry on error for magic mode
    this.retried = false;
    this.setDebouncedComplete();
    this.id = `prompt-${(Math.random() * Math.pow(10, 9)) | 0}`;
  }

  componentDidMount() {
    this.unsubscribe = ReplActiveInputStore.listen(this.onStoreChange);
    this.element = React.findDOMNode(this);
    const preferences = global.Mancy.preferences;
    this.editor = CodeMirror(this.element, {
      value: this.props.command,
      mode:  `text/${ReplLanguages.getLangQualifiedName(global.Mancy.session.lang)}`,
      gutters: preferences.toggleLineNumberGutter || preferences.toggleFoldGutter
        ? ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        : [],
      theme: _.kebabCase(global.Mancy.session.theme),
      keyMap: global.Mancy.session.keyMap,
      lineNumbers: preferences.toggleLineNumberGutter,
      lineWrapping: true,
      styleActiveLine: true,
      styleSelectedText: true,
      selectionPointer: true,
      matchBrackets: true,
      highlightSelectionMatches: true,
      autoCloseBrackets: true,
      resetSelectionOnContextMenu: false,
      autoFocus: true,
      foldGutter: preferences.toggleFoldGutter,
      foldOptions: {
        widget: '…'
      },
      electricChars: true,
      cursorBlinkRate: 530
    });

    const eventActions = [
      'inputRead', 'change', 'blur',
      'cursorActivity', 'contextmenu'
    ];
    eventActions.forEach(e => this.editor.on(e, this[`on${_.capitalize(e)}`]));
    this.editor.setOption("extraKeys", {
      Tab: this.onKeyTab,
      Enter: this.onKeyEnter,
      Up: this.onKeyUp,
      Down: this.onKeyDown,
      "Ctrl-Space": this.onPerformAutoComplete,
      "Shift-Enter": this.onKeyShiftEnter,
      "Shift-Ctrl-F": this.onFormat,
      "Ctrl-Q": this.onFoldAll,
      "Shift-Ctrl-Q": this.onUnFoldAll,
    });

    if(this.isREPLMode()) { this.focus(); }

    let cli = ReplLanguages.getREPL();
    //set desired repl mode
    cli.replMode = ReplLanguages.getREPLProvider()[`REPL_MODE_${(global.Mancy.session.mode || global.Mancy.session.mode).toUpperCase()}`];
    //bind write handle
    cli.output.write = this.addEntry.bind(this);
    cli.lines = [];
    this.contextCode.forEach(l => cli.memory(l));
    this.lines = _.clone(cli.lines);
    this.levels = _.clone(cli.lines.level);

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

  getPopupMenu() {
    return [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", click: e => this.onTriggerAction({action: 'undo'}) },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", click: e => this.onTriggerAction({action: 'redo'}) },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", "role": "cut" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", "role": "copy" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", "role": "paste" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", "role": "selectall",
          click: e => this.onTriggerAction({action: 'selectAll'}) },
      { type: "separator" },
      { label: 'Format', accelerator: 'Shift+Ctrl+F', click: this.onFormat },
      { label: "Fold All", accelerator: "Ctrl+Q", click: this.onFoldAll,
          enabled: global.Mancy.preferences.toggleFoldGutter && !!this.editor.getValue().length },
      { label: "UnFold All", accelerator: "Shift+Ctrl+Q", click: this.onUnFoldAll,
          enabled: global.Mancy.preferences.toggleFoldGutter && !!this.editor.getValue().length },
    ];
  }

  setDebouncedComplete() {
    this.debouncedComplete = _.debounce(
      () => this.complete(this.autoComplete),
      global.Mancy.preferences.suggestionDelay
    );
  }

  isREPLMode() {
    return global.Mancy.session.editor === 'REPL';
  }

  foldUnfoldAll(fold = true) {
    const cm = this.editor;
    const action = fold ? "fold" : "unfold";
    cm.operation(() => {
      const start = cm.firstLine();
      const end = cm.lastLine();
      for (let line = start; line <= end; line++) {
        cm.foldCode(CodeMirror.Pos(line, 0), null, action);
      }
    });
  }

  onFoldAll() {
    this.foldUnfoldAll(true);
  }

  onUnFoldAll() {
    this.foldUnfoldAll(false);
  }

  focus() {
    const cm = this.editor;
    let end = cm.lastLine();
    cm.setCursor({ line: end, ch: cm.doc.getLine(end).length });
    cm.focus();
  }

  resetSuggestionTimer() {
    if(this.suggestionTimerHandle) {
      clearTimeout(this.suggestionTimerHandle);
    }
    this.suggestionTimerHandle = null;
  }

  onBlur() {
    this.removeSuggestion();
  }

  onContextmenu(cm, e) {
    e.stopPropagation();
    e.preventDefault();
    this.menu = Menu.buildFromTemplate(this.getPopupMenu());
    this.menu.popup(remote.getCurrentWindow());
  }

  onCursorActivity() {
    let {activeSuggestion} = ReplActiveInputStore.getStore();
    if(activeSuggestion){
      this.removeSuggestion();
    }
  }

  onTriggerAction({action}) {
    this.editor[action]();
  }

  onSetEditorOption({name, value}) {
    this.editor.setOption(name, value);
  }

  onFormat() {
    const text = this.editor.getValue();
    let autoIndent = global.Mancy.session.lang !== 'js';
    if(!text.trim().length) { return; }
    if(!autoIndent) {
      const formattedCode =  ReplCommon.format(text);
      if(text !== formattedCode) {
        this.reloadPrompt(formattedCode);
        return;
      } else { autoIndent = true; }
    }

    if(autoIndent) {
      // auto indent
      const cm = this.editor;
      const start = cm.firstLine();
      const end = cm.lastLine();
      for (let line = start; line <= end; line++) {
        cm.indentLine(line);
      }
    }
  }

  onStoreChange(cmd) {
    if(cmd) {
      return cmd.action ?
        this.onTriggerAction(cmd) :
        this.onSetEditorOption(cmd);
    }

    let { now, activeSuggestion, breakPrompt,
          format, stagedCommands, autoComplete } = ReplActiveInputStore.getStore();

    this.setDebouncedComplete();

    if(autoComplete) {
      this.complete(this.autoComplete);
      return;
    }

    if(format) {
      return this.onFormat();
    }

    if(breakPrompt) {
      let cli = ReplLanguages.getREPL();
      cli.input.emit('data', '.break');
      cli.input.emit('data', EOL);
      this.reloadPrompt('');
      return;
    }

    if(stagedCommands.length) {
      let cli = ReplLanguages.getREPL();
      let text = stagedCommands[0];
      this.promptInput = text;
      let {local, output, input, force} = ReplInput.transform(text);
      this.force = !!force;

      cli.$lastExpression = ReplOutput.none();
      cli.context = ReplContext.getContext();

      if(local) {
        this.addEntryAction(output, true, input, text);
        ReplActiveInputStore.tailStagedCommands();
        return;
      }

      let out = output;
      if(!text.match(/^\s*\.load/)) {
        if(global.Mancy.session.lang !== 'js') {
          cli.transpile(output, cli.context, this.transpileAndExecute);
        } else {
          if(global.Mancy.session.mode === 'Strict') {
            output = `'use strict'; void 0; ${output}`
          }
          this.transpileAndExecute(_.isError(out) ? out : null, output);
        }
        return;
      }

      this.replFeed = text;
      cli.input.emit('data', this.replFeed);
      cli.input.emit('data', EOL);
      return;
    }

    if(now && activeSuggestion && activeSuggestion.id === this.id) {
      let {suggestion} = activeSuggestion;
      this.onSelectTabCompletion(suggestion.input, suggestion.expect);
      return;
    }
  }

  addEntryAction(formattedOutput, status, command, plainCode, transpiledOutput) {
    let addReplEntry = (output, formatted = false) => {
      this.element.className = 'repl-active-input';
      formattedOutput = formatted ? output : ReplOutput.some(output).highlight().formattedOutput;
      const entry = {
        formattedOutput,
        status,
        command,
        plainCode,
        transpiledOutput
      };
      if(this.isREPLMode() || this.history.idx === -1) {
        ReplActions.addEntry(entry);
      } else {
        ReplActions.updateEntry(this.history.idx, entry);
      }
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

    const cm = this.editor;
    const text = cm.getValue();
    const {line, ch} = cm.getCursor();
    const code = cm.doc.getRange({line: 0, ch: 0}, {line, ch});

    this.getHistorySuggession(code, suggestions);
    if(suggestions.length && completeEntry(suggestions, code)) {
      if(code === '.') {
        suggestions.push({
          type: ReplType.typeOf('source'),
          text: 'source',
          completeOn: ""
        });
      }
      ReplSuggestionActions.addSuggestion({suggestions: suggestions, input: code, id: this.id});
    } else {
      this.removeSuggestion();
    }
  }

  removeSuggestion() {
    this.resetSuggestionTimer();
    this.suggestionTimerHandle = setTimeout(() => ReplSuggestionActions.removeSuggestion(), 200);
  }

  reloadPrompt(cmd, cursor, idx = -1, staged = '') {
    const cm = this.editor;
    cm.setOption('readOnly', false);
    let lastLine = cm.lastLine();
    let endCursor = { line: lastLine, ch: cm.getLine(lastLine).length };
    cm.replaceRange(cmd, { line: 0, ch: 0 }, endCursor);

    this.history.idx = idx;
    this.history.staged = (idx === -1 ? cmd : staged);
    if(!cursor) {
      lastLine = cm.lastLine();
      cursor = { line: lastLine, ch: cm.getLine(lastLine).length };
    }
    cm.setCursor(cursor);
    cm.focus();
  }

  onTabCompletion(__, completion) {
    let [list, input] = completion;
    if(list.length === 0) {
      // revisit: use case ?
      const cm = this.editor;
      const spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
      cm.replaceSelection(spaces);
      this.removeSuggestion();
    } else if(list.length === 1) {
      this.onSelectTabCompletion(input, list[0].substring(input.length));
    } else {
      this.autoComplete(__, completion);
    }
  }

  onSelectTabCompletion(input, expect = "") {
    const cm = this.editor;
    let cursor = cm.getCursor();
    if(expect) {
      cm.setSelection(cursor);
      cm.replaceSelection(expect);
      let lines = expect.split('\n');
      if(lines.length > 1) {
        cursor.line += lines.length - 1;
        cursor.ch = lines[lines.length - 1].length;
      } else {
        cursor.ch += lines[0].length;
      }
      cm.setCursor(cursor);
      this.removeSuggestion();
      cm.focus();
    }
  }

  shouldTranspile() {
    return global.Mancy.preferences.transpile &&
      (global.Mancy.session.lang !== 'js' ||
        (global.Mancy.session.lang === 'js' && global.Mancy.session.babel))
  }

  canRetry(e) {
    return e && e.message && (!this.retried
      && global.Mancy.session.mode === 'Magic'
      && global.Mancy.session.lang === 'js'
      && e.message === BLOCK_SCOPED_ERR_MSG
      || this.wrapExpression
    );
  }

  transpileAndExecute(err, result) {
    let text = this.promptInput;
    if(err) {
      if(this.canRetry(err)) {
        this.wrapExpression = false;
        this.retried = true;
        this.execute(true);
      } else {
        this.addEntryAction(ReplOutput.none().highlight(err).formattedOutput,
          !err, ReplCommon.highlight(text), text);
      }
    } else {
      ReplCommon.runInContext(result, (err, output) => {
        if(err && this.canRetry(err)) { this.execute(true); }
        else {
          let {formattedOutput} = this.force && !err ? { 'formattedOutput': output } : ReplOutput.some(err || output).highlight();
          let transpiledOutput = !this.shouldTranspile() ? null : ReplOutput.transpile(result);
          this.addEntryAction(formattedOutput, !err, ReplCommon.highlight(text), text, transpiledOutput);
        }
      });
    }
  }

  onChange(cm, change) {
    if(change.origin === '+delete') {
      this.onInputRead(cm, change);
    }
  }

  onInputRead(cm, change) {
    this.removeSuggestion();
    if(change.origin === 'paste' ||
      global.Mancy.preferences.toggleAutomaticAutoComplete) { return; }
    this.debouncedComplete();
  }

  onPerformAutoComplete() {
    let {activeSuggestion} = ReplActiveInputStore.getStore();
    if(!activeSuggestion){
      this.complete(this.onTabCompletion, true);
    }
  }

  execute(forceStrict = false) {
    let cli = ReplLanguages.getREPL();
    // managed by us (no react)
    this.element.className += ' repl-active-input-running';
    if(this.isREPLMode()) {
      this.editor.setOption("readOnly", true);
    }

    setTimeout(() => {
      let text = this.editor.getValue();
      if(cli.bufferedCommand.length) {
        cli.input.emit('data', '.break');
        cli.input.emit('data', EOL);
      }
      cli.$lastExpression = ReplOutput.none();
      cli.context = ReplContext.getContext();
      this.promptInput = text;
      this.wrapExpression = !forceStrict && /^\s*\{/.test(text) && /\}\s*$/.test(text);
      // all transpiled languages, () has same meaning
      // no need to filter by lang
      if(this.wrapExpression) {
        text = `(${text})`;
      }

      let {local, output, input, force} = ReplInput.transform(text);
      let out = output;
      this.force = !!force;

      if(local) {
        return this.addEntryAction(output, true, input, text);
      }

      if(!text.match(/^\s*\.load/)) {
        if(global.Mancy.session.lang !== 'js') {
          cli.transpile(output, cli.context, this.transpileAndExecute);
        } else {
          if(forceStrict || global.Mancy.session.mode === 'Strict') {
            output = `'use strict'; void 0; ${output}`
          }
          this.transpileAndExecute(_.isError(out) ? out : null, output);
        }
        return;
      }

      this.replFeed = text;
      cli.input.emit('data', this.replFeed);
      cli.input.emit('data', EOL);
    }, 17);
  }

  onRun() {
    // preactions before execute
    this.removeSuggestion();
    ReplDOM.scrollToEnd();
    this.execute();
  }

  onKeyEnter(cm) {
    let activeSuggestion = ReplActiveInputStore.getStore().activeSuggestion;
    if(activeSuggestion && global.Mancy.preferences.autoCompleteOnEnter) {
      let {suggestion} = activeSuggestion;
      this.onSelectTabCompletion(suggestion.input, suggestion.expect);
      return;
    }

    return !global.Mancy.preferences.toggleShiftEnter
      ? this.onRun()
      : CodeMirror.Pass;
  }

  onKeyShiftEnter(cm) {
    return global.Mancy.preferences.toggleShiftEnter
      ? this.onRun()
      : CodeMirror.Pass;
  }

  onKeyTab(cm) {
    let {activeSuggestion} = ReplActiveInputStore.getStore();
    if(activeSuggestion && activeSuggestion.id === this.id) {
      let {suggestion} = activeSuggestion;
      this.onSelectTabCompletion(suggestion.input, suggestion.expect);
      return;
    }
    return CodeMirror.Pass;
  }

  onKeyUpDown(direction = -1) {
    let up = direction === -1;
    let {activeSuggestion} = ReplActiveInputStore.getStore();
    if(!activeSuggestion) {
      const cm = this.editor;
      const {line} = cm.getCursor();
      if(global.Mancy.session.editor === 'REPL' &&
        (up && line === 0) ||
        (!up && cm.lineCount() - 1 === line)) {
        this.traverseHistory(direction);
      }
      else { return CodeMirror.Pass; }
    }
  }

  onKeyUp() {
    return this.onKeyUpDown(-1);
  }

  onKeyDown(e) {
    return this.onKeyUpDown(1);
  }

  traverseHistory(direction = -1) {
    const len = this.history.log.length;
    const up = direction === -1;
    if(!len) { return; }
    let idx = this.history.idx;
    if(idx === -1) {
      this.history.staged = this.editor.getValue();
      idx = len;
    }
    idx = idx + direction;

    let navigateHistory = (up, cmd, pos) => {
      let code = cmd.trim();
      let cursor = !up ? {line:0} : null;
      this.reloadPrompt(code, cursor, pos,(pos === -1 ? '' : this.history.staged));
    };

    (len <= idx || idx < 0)
      ? navigateHistory(up, this.history.staged, -1)
      : navigateHistory(up, this.history.log[idx].plainCode, idx);
  }

  getHistorySuggession(code, suggestion = []) {
    if(!code) { return; }
    // consider only recent history
    const maxSize = ReplConstants.REPL_HISTORY_SUGGESTION;
    const history = this.history.log || [];
    const len = history.length;
    const sz = code.length;
    let cnt = 1, pos = len - 1, dups = {};
    // reverse search
    for(; pos >= 0 && cnt <= maxSize; pos -= 1, cnt += 1) {
      let cmd = history[pos].plainCode.trim();
      if(cmd !== code && cmd.startsWith(code) && !dups[cmd]) {
        suggestion.push({
          type: ReplType.typeOf('history'),
          text: cmd,
          completeOn: cmd.substring(0, sz)
        });
        dups[cmd] = cmd;
      }
    }
    return suggestion;
  }

  complete(callback, allowEmpty = false) {
    const cm = this.editor;
    const {line, ch} = cm.getCursor();
    const code = cm.getValue();
    const beforeCursor = cm.doc.getLine(line).substring(0, ch);

    if(!allowEmpty && !beforeCursor.trim().length) { return; }
    ReplSuggestionActions.removeSuggestion();

    // node repl patch
    let cli = ReplLanguages.getREPL();
    cli.bufferedCommand = "";
    cli.lines = _.clone(this.lines);
    cli.lines.level = _.clone(this.levels);
    try {
      // dont leak auto complete errors
      if(line > 0) {
        cli.bufferedCommand = cm.doc.getRange({line: 0, ch: 0}, {line: line - 1});
        cli.bufferedCommand.split('\n').forEach(l => cli.memory(l));
      }
      cli.complete(beforeCursor, callback);
    } catch(e) {
      console.log('on autoComplete', e)
    }
  }

  render() {
    return (
      <div className='repl-active-input' id={this.id}>
      </div>
    );
  }
}

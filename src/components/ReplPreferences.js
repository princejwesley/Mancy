import React from 'react';
import _ from 'lodash';
import ReplPreferencesStore from '../stores/ReplPreferencesStore';
import ReplStatusBarActions from '../actions/ReplStatusBarActions';
import ReplFontFamily from './ReplFontFamily';
import ReplPageZoom from './ReplPageZoom';
import {ipcRenderer} from 'electron';

let langs = {
  js: 'JavaScript',
  ls: 'LiveScript',
  ts: 'TypeScript',
  coffee: 'CoffeeScript',
  cljs: 'ClojureScript',
};

export default class ReplPreferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.clone(ReplPreferencesStore.getStore());
    _.each([
      'onToggleView', 'onClose', 'onThemeChange', 'onBabelChange',
      'onModeChange', 'onChangeTimeout', 'onChangeSuggestionDelay', 'onToggleShiftEnter',
      'onAsyncWrapChange', 'onToggleAutoCompleteOnEnter', 'onToggleAutomaticAutoComplete',
      'onLangChange', 'onWatermarkChange', 'onToggleTranspile', 'selectLoadScript',
      'resetLoadScript', 'onTogglePromptOnClose', 'onEditorChange',
      'onCloseNPMPath', 'addNPMPath', 'resetNPMPath', 'onMoveNPMPathUp', 'onMoveNPMPathDown',
      'onToggleLineNumberGutter', 'onToggleFoldGutter', 'onKeyMapChange', 'onChangeHistorySize',
      'onToggleHistoryAggressive', 'showTypeScriptPreferences', 'onSetTypeScriptOptions',
      'showClojureScriptPreferences', 'showLangPreferences', 'onSetClojureScriptOptions',
      'onParinferModeChange', 'onParinferPreviewChange', 'onToggleExecutionTime'
    ], (field) => {
      this[field] = this[field].bind(this);
    });
  }

  componentDidMount() {
    this.unsubscribe = ReplPreferencesStore.listen(this.onToggleView);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  selectLoadScript() {
    let extensions = _.chain(require.extensions)
      .keys()
      .map((ext) => ext.substring(1))
      .value();
    let result = ipcRenderer.sendSync('application:open-sync-resource', {
      filters: [{ name: 'Scripts', extensions }],
      title: 'Select startup script',
      properties: ['openFile']
    });
    if(result.length) {
      ReplPreferencesStore.onSelectLoadScript(result[0]);
    }
  }

  resetLoadScript() {
    ReplPreferencesStore.onSelectLoadScript(null);
  }

  onToggleView() {
    this.setState(ReplPreferencesStore.getStore());
  }

  onClose() {
    ReplPreferencesStore.onClosePreferences();
  }

  onThemeChange(e) {
    ReplPreferencesStore.onSetTheme(e.target.value);
  }

  onKeyMapChange(e) {
    ReplPreferencesStore.onSetKeyMap(e.target.value);
  }

  onBabelChange(e) {
    ReplPreferencesStore.toggleBabel(e.target.checked);
  }

  onWatermarkChange(e) {
    ReplPreferencesStore.toggleWatermark(e.target.checked);
  }

  onModeChange(e) {
    ReplPreferencesStore.onSetREPLMode(e.target.value);
  }

  onEditorChange(e) {
    ReplPreferencesStore.onSetEditorMode(e.target.value);
  }

  onLangChange(e) {
    ReplPreferencesStore.onSetLanguage(e.target.value);
    this.setState({
      lang: e.target.value
    });
  }

  onChangeTimeout(e) {
    ReplPreferencesStore.onSetExeTimeout(e.target.value);
  }

  onToggleExecutionTime(e) {
    ReplPreferencesStore.onToggleExecutionTime(e.target.checked);
  }

  onChangeSuggestionDelay(e) {
    ReplPreferencesStore.onSetSuggestionDelay(e.target.value);
  }

  onToggleShiftEnter(e) {
    ReplPreferencesStore.toggleShiftEnter(e.target.checked);
    ReplStatusBarActions.updateRunCommand();
  }

  onToggleAutoCompleteOnEnter(e) {
    ReplPreferencesStore.toggleAutoCompleteOnEnter(e.target.checked);
  }

  onAsyncWrapChange(e) {
    ReplPreferencesStore.toggleAsyncWrap(e.target.checked);
  }

  onToggleAutomaticAutoComplete(e) {
    ReplPreferencesStore.toggleAutomaticAutoComplete(e.target.checked);
  }

  onToggleTranspile(e) {
    ReplPreferencesStore.toggleTranspile(e.target.checked);
  }

  onTogglePromptOnClose(e) {
    ReplPreferencesStore.togglePromptOnClose(e.target.checked);
  }

  onToggleFoldGutter(e) {
    ReplPreferencesStore.toggleFoldGutter(e.target.checked);
  }

  onToggleLineNumberGutter(e) {
    ReplPreferencesStore.toggleLineNumberGutter(e.target.checked);
  }

  onChangeHistorySize(e) {
    ReplPreferencesStore.onSetHistorySize(e.target.value);
  }

  onToggleHistoryAggressive(e) {
    ReplPreferencesStore.toggleHistoryAggressive(e.target.value === 'true');
  }

  onCloseNPMPath(e) {
    let path = e.target.dataset.path;
    ReplPreferencesStore.removeNPMPath(path);
  }

  resetNPMPath(e) {
    ReplPreferencesStore.resetNPMPaths();
  }

  addNPMPath(e) {
    let result = ipcRenderer.sendSync('application:open-sync-resource', {
      title: 'Add node modules path',
      properties: ['openDirectory']
    });
    if(result.length) {
      ReplPreferencesStore.addNPMPath(result[0]);
    }
  }

  onMoveNPMPathUp(e) {
    let path = e.target.dataset.path;
    ReplPreferencesStore.moveNPMPath(path, -1);
  }

  onMoveNPMPathDown(e) {
    let path = e.target.dataset.path;
    ReplPreferencesStore.moveNPMPath(path, 1);
  }

  onParinferModeChange(e) {
    ReplPreferencesStore.onParinferModeChange(e.target.value);
  }

  onParinferPreviewChange(e) {
    ReplPreferencesStore.onParinferPreviewChange(e.target.checked);
  }

  onSetTypeScriptOptions(name) {
    return e => ReplPreferencesStore.onSetTypeScriptOptions(name, e.target.checked);
  }

  onSetClojureScriptOptions(name) {
    return e => ReplPreferencesStore.onSetClojureScriptOptions(name, e.target.checked);
  }

  showLangPreferences() {
    if(this.state.lang === 'ts') { return this.showTypeScriptPreferences(); }
    else if(this.state.lang === 'js') { return this.showJavaScriptPreferences(); }
    else if(this.state.lang === 'cljs') { return this.showClojureScriptPreferences(); }

    return null;
  }

  showClojureScriptPreferences() {
    const imgURL = `./logos/${this.state.lang}.png`;
    let icon = <img className='lang-img cljs-img' src={imgURL} title='ClojureScript Warning Options'/>;
    const config = [
      { name: 'preamble-missing', tip: 'missing preamble'},
      { name: 'undeclared-var', tip: 'undeclared var'},
      { name: 'undeclared-ns', tip: 'var references non-existent namespace'},
      { name: 'undeclared-ns-form', tip: 'namespace reference in ns form that does not exist'},
      { name: 'redef', tip: 'var redefinition'},
      { name: 'dynamic', tip: 'dynamic binding of non-dynamic var'},
      { name: 'fn-var', tip: 'var previously bound to fn changed to different type'},
      { name: 'fn-arity', tip: 'invalid invoke arity'},
      { name: 'fn-deprecated', tip: 'deprecated function usage'},
      { name: 'protocol-deprecated', tip: 'deprecated protocol usage'},
      { name: 'undeclared-protocol-symbol', tip: 'undeclared protocol referred'},
      { name: 'invalid-protocol-symbol', tip: 'invalid protocol symbol'},
      { name: 'multiple-variadic-overloads', tip: 'multiple variadic arities'},
      { name: 'variadic-max-arity', tip: 'arity greater than variadic arity'},
      { name: 'overload-arity', tip: 'duplicate arities'},
      { name: 'extending-base-js-type', tip: 'JavaScript base type extension'},
      { name: 'invoke-ctor', tip: 'type constructor invoked as function'},
      { name: 'invalid-arithmetic', tip: 'invalid arithmetic'},
      { name: 'protocol-invalid-method', tip: 'protocol method does not match declaration'},
      { name: 'protocol-duped-method', tip: 'duplicate protocol method implementation'},
      { name: 'protocol-multiple-impls', tip: 'protocol implemented multiple times'},
      { name: 'single-segment-namespace', tip: 'single segment namespace'},
    ];

    return (
      <div class='clojurescript-preferences'>
        <div className='preference'>
          <div className='preference-name' title='Parinfer Editor Mode'>
            Parinfer Mode {icon}
          </div>
          <div className='preference-value'>
            <fieldset>
              <span className='radio-group' title='Turn Off Parinfer'>
                <input type="radio" name="parinfer" checked={this.state.clojurescript.parinfer.mode === 'off'}
                  value="off" onClick={this.onParinferModeChange} /> Off
              </span>
              <span className='radio-group'>
                <input type="radio" name="parinfer" checked={this.state.clojurescript.parinfer.mode === 'indent'}
                  value="indent" onClick={this.onParinferModeChange} /> Indent Mode
              </span>
              <span className='radio-group'>
                <input type="radio" name="parinfer" checked={this.state.clojurescript.parinfer.mode === 'paren'}
                  value="paren" onClick={this.onParinferModeChange} /> Parent Mode
              </span>
            </fieldset>
            {
              this.state.clojurescript.parinfer.mode === 'indent'
                ? <span className='checkbox-group' title="it shows the cursor's scope on an empty line by inserting close-parens after it">
                    <input type="checkbox" name="previewCursorScope"
                      checked={this.state.clojurescript.parinfer.previewCursorScope} value=""
                      onClick={this.onParinferPreviewChange} /> Preview Cursor Scope
                  </span>
                : null
            }
          </div>
        </div>
        <div className='preference'>
          <div className='preference-name'>
            Warning Options {icon}
          </div>
          <div className='preference-value'>
            {
              _.map(config, (c, idx) => (
                <span className='checkbox-group' title={c.tip}>
                  <input type="checkbox" name={"cljs-compile-" + idx} checked={this.state.clojurescript[c.name]} value=""
                    onClick={this.onSetClojureScriptOptions(c.name)} /> {_.startCase(c.name)}
                </span>
              ))
            }
          </div>
        </div>
      </div>
    );

  }

  showTypeScriptPreferences() {
    const imgURL = `./logos/${this.state.lang}.png`;
    let icon = <img className='lang-img ts-img' src={imgURL} title='TS Preferences'/>;
    const config = [
      { name: 'ignoreSemanticError', tip: 'Ignore semantic errors'},
      { name: 'noImplicitAny', tip: "Raise error on expressions and declarations with an implied 'any' type"},
      { name: 'preserveConstEnums', tip: 'Do not erase const enum declarations in generated code'},
      { name: 'allowUnusedLabels', tip: 'Do not report errors on unused labels'},
      { name: 'noImplicitReturns', tip: 'Report error when not all code paths in function return a value'},
      { name: 'noFallthroughCasesInSwitch', tip: 'Report errors for fallthrough cases in switch statement'},
      { name: 'allowUnreachableCode', tip: 'Do not report errors on unreachable code'},
      { name: 'forceConsistentCasingInFileNames', tip: 'Disallow inconsistently-cased references to the same file'},
      { name: 'allowSyntheticDefaultImports', tip: 'Allow default imports from modules with no default export'},
      { name: 'allowJs', tip: 'Allow JavaScript files to be compiled'},
      { name: 'noImplicitUseStrict', tip: 'Do not emit "use strict" directives in module output'},
      { name: 'noEmitHelpers', tip: 'Do not generate custom helper functions like __extends in compiled output'},
    ];
    return (
      <div class='typescript-preferences'>
        <div className='preference'>
          <div className='preference-name'>
            Compiler Options {icon}
          </div>
          <div className='preference-value'>
            {
              _.map(config, (c, idx) => (
                <span className='checkbox-group' title={c.tip}>
                  <input type="checkbox" name={"ts-compile-" + idx} checked={this.state.typescript[c.name]} value=""
                    onClick={this.onSetTypeScriptOptions(c.name)} /> {_.startCase(c.name)}
                </span>
              ))
            }
          </div>
        </div>
      </div>
    );
  }

  showJavaScriptPreferences() {
    const imgURL = `./logos/${this.state.lang}.png`;
    let icon = <img className='lang-img js-img' src={imgURL} title='JS Preferences'/>;
    return (
      <div class='javascript-preferences'>
        <div className='preference'>
          <div className='preference-name'>
            REPL Mode {icon}
          </div>
          <div className='preference-value'>
            <fieldset>
              <span className='radio-group'>
                <input type="radio" name="mode" disabled={this.state.lang !== 'js'} checked={this.state.mode === 'Sloppy'} value="Sloppy" onClick={this.onModeChange} /> Sloppy
              </span>
              <span className='radio-group'>
                <input type="radio" name="mode" disabled={this.state.lang !== 'js'} checked={this.state.mode === 'Strict'} value="Strict" onClick={this.onModeChange} /> Strict
              </span>
            </fieldset>
          </div>
        </div>
        <div className='preference' title='enable babel transcompiler for javascript'>
          <div className='preference-name'>
            Babel Transform {icon}
          </div>
          <div className='preference-value'>
            <span className='checkbox-group'>
              <input type="checkbox" name="babel"
                checked={this.state.babel} value=""
                disabled={this.state.lang !== 'js'} onClick={this.onBabelChange} />
            </span>
          </div>
        </div>
        <div className='preference' title='await expression ￫ (async function(){ let result = (await expression); return result; }())'>
          <div className='preference-name'>
            Auto Async Wrapper {icon}
          </div>
          <div className='preference-value'>
            <span className='checkbox-group'>
              <input type="checkbox" name="await"
                checked={this.state.asyncWrap} value=""
                disabled={this.state.lang !== 'js'} onClick={this.onAsyncWrapChange} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  render() {
    let clazz = `repl-preferences-panel ${this.state.open ? 'open' : ''}`;
    return (
      <div className={clazz}>
        <div className="repl-preferences-head">
          <span className='title'>
            Preferences
          </span>
          <span className="close-preference" onClick={this.onClose}>
            <i className="fa fa-times"></i>
          </span>
        </div>
        <div className="repl-preferences-body">
          <div className='preference'>
            <div className='preference-name'>
              Theme
            </div>
            <div className='preference-value'>
              <fieldset>
                <span className='radio-group'>
                  <input type="radio" name="theme" checked={this.state.theme === 'Dark Theme'} value="Dark Theme" onClick={this.onThemeChange} /> dark
                </span>
                <span className='radio-group'>
                  <input type="radio" name="theme" checked={this.state.theme === 'Light Theme'} value="Light Theme" onClick={this.onThemeChange} /> light
                </span>
              </fieldset>
            </div>
          </div>
          <ReplFontFamily/>
          <ReplPageZoom/>
          <div className='preference'>
            <div className='preference-name'>
              Editor Mode
            </div>
            <div className='preference-value'>
              <fieldset>
                <span className='radio-group'>
                  <input type="radio" name="editor" checked={this.state.editor === 'REPL'} value="REPL" onClick={this.onEditorChange} /> REPL
                </span>
                <span className='radio-group'>
                  <input type="radio" name="editor" checked={this.state.editor === 'Notebook'} value="Notebook" onClick={this.onEditorChange} /> Notebook<small>(beta)</small>
                </span>
              </fieldset>
            </div>
          </div>
          <div className='preference'>
            <div className='preference-name'>
              Language
            </div>
            <div className='preference-value'>
              <select onChange={this.onLangChange} title='Languages'>
                {
                  _.map(langs, (v, k) => {
                    return <option selected={k === this.state.lang} value={k}>{v}</option>
                  })
                }
              </select>
            </div>
          </div>
          {
            this.showLangPreferences()
          }
          <div className='preference' title='Time taken for execution'>
            <div className='preference-name'>
              Show Execution Time
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="execution-time" checked={this.state.executionTime} value="" onClick={this.onToggleExecutionTime} />
              </span>
            </div>
          </div>
          <div className='preference' title='(0 for no timeout)'>
            <div className='preference-name'>
              Execution Timeout(ms)
            </div>
            <div className='preference-value'>
              <span className='textbox'>
                <input type="number" name="exec-timeout" placeholder="(0 for no timeout)" value={this.state.timeout} min="0" onChange={this.onChangeTimeout} />
              </span>
            </div>
          </div>
          <div className='preference' title="key map">
            <div className='preference-name'>
              Key Map
            </div>
            <div className='preference-value'>
              <fieldset>
                <span className='radio-group'>
                  <input type="radio" name="key-map" checked={this.state.keyMap === 'default'} value="default" onClick={this.onKeyMapChange} /> default
                </span>
                <span className='radio-group'>
                  <input type="radio" name="key-map" checked={this.state.keyMap === 'sublime'} value="sublime" onClick={this.onKeyMapChange} /> sublime
                </span>
                <span className='radio-group'>
                  <input type="radio" name="key-map" checked={this.state.keyMap === 'vim'} value="vim" onClick={this.onKeyMapChange} /> vim
                </span>
                <span className='radio-group'>
                  <input type="radio" name="key-map" checked={this.state.keyMap === 'emacs'} value="emacs" onClick={this.onKeyMapChange} /> emacs
                </span>
              </fieldset>
            </div>
          </div>
          <div className='preference' title='Show line number gutter'>
            <div className='preference-name'>
              Show Line Number Gutter
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="line" checked={this.state.toggleLineNumberGutter} value="" onClick={this.onToggleLineNumberGutter} />
              </span>
            </div>
          </div>
          <div className='preference' title='Code fold gutter'>
            <div className='preference-name'>
              Show Fold Gutter
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="fold" checked={this.state.toggleFoldGutter} value="" onClick={this.onToggleFoldGutter} />
              </span>
            </div>
          </div>
          <div className='preference' title='Disable automatic auto complete'>
            <div className='preference-name'>
              Disable Automatic Auto Complete
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="auto" checked={this.state.toggleAutomaticAutoComplete} value="" onClick={this.onToggleAutomaticAutoComplete} />
              </span>
            </div>
          </div>
          <div className='preference' title='auto suggestion popup delay(ms)'>
            <div className='preference-name'>
              Auto Complete Popup Delay(ms)
            </div>
            <div className='preference-value'>
              <span className='textbox'>
                <input type="number" name="suggestion-delay" placeholder="(0 for no delay)"
                  value={this.state.suggestionDelay} min="0" disabled={this.state.toggleAutomaticAutoComplete}
                  onChange={this.onChangeSuggestionDelay} />
              </span>
            </div>
          </div>
          <div className='preference' title='Toggle run mode (⇧ + ↲) / ↲(default)'>
            <div className='preference-name'>
              Toggle Run Mode (⇧ + ↲) / ↲
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="toggle-shift-enter" checked={this.state.toggleShiftEnter} value="" onClick={this.onToggleShiftEnter} />
              </span>
            </div>
          </div>
          <div className='preference' title='Auto suggest selection result on ↲'>
            <div className='preference-name'>
              Auto Suggest Selection on ↲
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="toggle-auto-suggestion" checked={this.state.autoCompleteOnEnter} value="" onClick={this.onToggleAutoCompleteOnEnter} />
              </span>
            </div>
          </div>
          <div className='preference' title='Show transpiled ES5 code'>
            <div className='preference-name'>
              Transpiled View
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="toggle-transpile"
                  checked={this.state.transpile} value="" onClick={this.onToggleTranspile} />
              </span>
            </div>
          </div>
          <div className='preference' title='Show/hide watermark'>
            <div className='preference-name'>
              Show Watermark
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="toggle-watermark" checked={this.state.watermark} value="" onClick={this.onWatermarkChange} />
              </span>
            </div>
          </div>
          <div className='preference' title='Warn before quit window'>
            <div className='preference-name'>
              Warn Before Quit
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="warn-before-quit" checked={this.state.promptOnClose} value="" onClick={this.onTogglePromptOnClose} />
              </span>
            </div>
          </div>
          <div className='preference' title='Startup script'>
            <div className='preference-name'>
              Startup Script
            </div>
            <div className='preference-value'>
              <div>{this.state.loadScript}</div>
              <button type='button' name='startup-script' onClick={this.selectLoadScript}> Choose File</button>
              {
                this.state.loadScript
                  ? <button type='button' name='reset-startup-script' onClick={this.resetLoadScript}> reset</button>
                  : null
              }
            </div>
          </div>
          <div className='preference' title='Add node modules path'>
            <div className='preference-name'>
              Add Node Modules Path
            </div>
            <div className='preference-value'>
              {
                _.map(this.state.npmPaths, (path, pos) => {
                  return (
                    <div>
                      {path}
                      <i className='fa fa-close close' data-path={path} onClick={this.onCloseNPMPath}></i>
                      {
                        pos !== 0
                          ? <i className='fa fa-arrow-up' data-path={path} onClick={this.onMoveNPMPathUp}></i>
                          : null
                      }
                      {
                        pos < this.state.npmPaths.length - 1
                          ? <i className='fa fa-arrow-down' data-path={path} onClick={this.onMoveNPMPathDown}></i>
                          : null
                      }
                    </div>
                  );
                })
              }
              <button type='button' name='npm-path' onClick={this.addNPMPath}> Add</button>
              {
                this.state.npmPaths.length
                  ? <button type='button' name='reset-npm-path' onClick={this.resetNPMPath}> reset</button>
                  : null
              }
            </div>
          </div>
          <div className='preference' title='Persistent History size'>
            <div className='preference-name'>
              History Size
            </div>
            <div className='preference-value'>
              <span className='textbox'>
                <input type="number" name="history-size" placeholder="(0 for no history)" value={this.state.historySize} min="0" onChange={this.onChangeHistorySize} />
              </span>
            </div>
          </div>
          <div className='preference' title='Persistent History on executing each command or on close session'>
            <div className='preference-name'>
              History Save Mode
            </div>
            <div className='preference-value'>
              <fieldset>
                <span className='radio-group'>
                  <input type="radio" name="history-aggressive" checked={this.state.historyAggressive === true} value="true" onClick={this.onToggleHistoryAggressive} /> Aggressive
                </span>
                <span className='radio-group'>
                  <input type="radio" name="history-aggressive" checked={this.state.historyAggressive === false} value="false" onClick={this.onToggleHistoryAggressive} /> On Session Close
                </span>
              </fieldset>
            </div>
          </div>
          <div className='statusbar-placeholder'></div>
        </div>
      </div>
    );
  }
}

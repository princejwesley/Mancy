import React from 'react';
import _ from 'lodash';
import ReplPreferencesStore from '../stores/ReplPreferencesStore';
import ReplStatusBarActions from '../actions/ReplStatusBarActions';

export default class ReplPreferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.clone(ReplPreferencesStore.getStore());
    _.each([
      'onToggleView', 'onClose', 'onThemeChange', 'onBabelChange',
      'onModeChange', 'onChangeTimeout', 'onChangeSuggestionDelay', 'onToggleShiftEnter',
      'onAsyncWrapChange', 'onToggleAutoCompleteOnEnter', 'onToggleAutomaticAutoComplete',
      'onLangChange'
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

  onToggleView() {
    this.setState(ReplPreferencesStore.getStore());
  }

  onClose() {
    ReplPreferencesStore.onClosePreferences();
  }

  onThemeChange(e) {
    ReplPreferencesStore.onSetTheme(e.target.value);
  }

  onBabelChange(e) {
    ReplPreferencesStore.toggleBabel(e.target.checked);
  }

  onModeChange(e) {
    ReplPreferencesStore.onSetREPLMode(e.target.value);
  }

  onLangChange(e) {
    ReplPreferencesStore.onSetLanguage(e.target.value);
  }

  onChangeTimeout(e) {
    ReplPreferencesStore.onSetExeTimeout(e.target.value);
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
          <div className='preference'>
            <div className='preference-name'>
              Language
            </div>
            <div className='preference-value'>
              <fieldset>
                <span className='radio-group'>
                  <input type="radio" name="lang" checked={this.state.lang === 'js'} value="js" onClick={this.onLangChange} /> JavaScript
                </span>
                <span className='radio-group'>
                  <input type="radio" name="lang" checked={this.state.lang === 'coffee'} value="coffee" onClick={this.onLangChange} /> CoffeeScript
                </span>
                <span className='radio-group'>
                  <input type="radio" name="lang" checked={this.state.lang === 'ts'} value="ts" onClick={this.onLangChange} /> TypeScript
                </span>
              </fieldset>
            </div>
          </div>
          <div className='preference'>
            <div className='preference-name'>
              REPL mode
            </div>
            <div className='preference-value'>
              <fieldset>
                <span className='radio-group'>
                  <input type="radio" name="mode" checked={this.state.mode === 'Magic'} value="Magic" onClick={this.onModeChange} /> Magic
                </span>
                <span className='radio-group'>
                  <input type="radio" name="mode" checked={this.state.mode === 'Sloppy'} value="Sloppy" onClick={this.onModeChange} /> Sloppy
                </span>
                <span className='radio-group'>
                  <input type="radio" name="mode" checked={this.state.mode === 'Strict'} value="Strict" onClick={this.onModeChange} /> Strict
                </span>
              </fieldset>
            </div>
          </div>
          <div className='preference' title='enable babel transcompiler for javascript'>
            <div className='preference-name'>
              Babel transform
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
              Auto async wrapper
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="await"
                  checked={this.state.asyncWrap} value=""
                  disabled={this.state.lang !== 'js'} onClick={this.onAsyncWrapChange} />
              </span>
            </div>
          </div>
          <div className='preference' title='(0 for no timeout)'>
            <div className='preference-name'>
              Execution timeout(ms)
            </div>
            <div className='preference-value'>
              <span className='textbox'>
                <input type="number" name="exec-timeout" placeholder="(0 for no timeout)" value={this.state.timeout} min="0" onChange={this.onChangeTimeout} />
              </span>
            </div>
          </div>
          <div className='preference' title='Disable automatic auto complete'>
            <div className='preference-name'>
              Disable automatic auto complete
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="await" checked={this.state.toggleAutomaticAutoComplete} value="" onClick={this.onToggleAutomaticAutoComplete} />
              </span>
            </div>
          </div>
          <div className='preference' title='auto suggestion popup delay(ms)'>
            <div className='preference-name'>
              Auto complete popup delay(ms)
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
              Toggle run mode (⇧ + ↲) / ↲
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="toggle-shift-enter" checked={this.state.toggleShiftEnter} value="" onClick={this.onToggleShiftEnter} />
              </span>
            </div>
          </div>
          <div className='preference' title='Auto suggest selection result on ↲'>
            <div className='preference-name'>
              Auto suggest selection on ↲
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="toggle-auto-suggestion" checked={this.state.autoCompleteOnEnter} value="" onClick={this.onToggleAutoCompleteOnEnter} />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

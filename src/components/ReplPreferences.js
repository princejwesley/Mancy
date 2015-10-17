import React from 'react';
import _ from 'lodash';
import ReplPreferencesStore from '../stores/ReplPreferencesStore';

export default class ReplPreferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.clone(ReplPreferencesStore.getStore());
    _.each([
      'onToggleView', 'onClose', 'onThemeChange', 'onBabelChange', 'onToggleGlobalPath',
      'onModeChange'
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

  onToggleGlobalPath(e) {
    ReplPreferencesStore.toggleGlobalPath(e.target.checked);
  }

  onModeChange(e) {
    ReplPreferencesStore.onSetREPLMode(e.target.value);
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
              REPL Mode
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
          <div className='preference'>
            <div className='preference-name'>
              Babel Transform
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="babel" checked={this.state.babel} value="" onClick={this.onBabelChange} />
              </span>
            </div>
          </div>
          <div className='preference'>
            <div className='preference-name'>
              NPM Global Path
            </div>
            <div className='preference-value'>
              <span className='checkbox-group'>
                <input type="checkbox" name="global" checked={this.state.global} value="" onClick={this.onToggleGlobalPath} />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

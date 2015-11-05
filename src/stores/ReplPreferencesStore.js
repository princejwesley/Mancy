import ReplPreferencesActions from '../actions/ReplPreferencesActions';
import ReplActions from '../actions/ReplActions';
import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';
import _ from 'lodash';
import ipc from 'ipc';

let open = false;
const ReplPreferencesStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplPreferencesActions);
  },
  onOpenPreferences() {
    if(open) { return; }
    open = true;
    this.trigger(open);
  },
  onClosePreferences() {
    if(!open) { return; }
    open = false;
    this.trigger(open);
  },
  onTogglePreferences() {
    open = !open;
    this.trigger();
  },
  updatePreference(cb) {
    let preferences = JSON.parse(localStorage.getItem('preferences'));
    cb(preferences);
    global.Mancy.preferences = preferences;
    global.Mancy.preferences.shiftEnter = true;
    localStorage.setItem('preferences', JSON.stringify(preferences));
    ipc.send('application:sync-preference', preferences);
    this.trigger();
  },
  toggleBabel(flag) {
    this.updatePreference((preferences) => {
      preferences.babel = flag;
    });
  },
  toggleAsyncWrap(flag) {
    this.updatePreference((preferences) => {
      preferences.asyncWrap = flag;
    });
  },
  toggleShiftEnter(flag) {
    this.updatePreference((preferences) => {
      preferences.toggleShiftEnter = flag;
    });
  },
  toggleAutoCompleteOnEnter(flag) {
    this.updatePreference((preferences) => {
      preferences.autoCompleteOnEnter = flag;
    });
  },
  onSetTheme(name) {
    this.updatePreference((preferences) => {
      preferences.theme = name;
      document.body.className = name.toLowerCase().replace(/\s/, '-');
    });
  },
  onSetREPLMode(mode) {
    this.updatePreference((preferences) => {
      preferences.mode = mode;
      ReplActions.setREPLMode(mode);
    });
  },
  onSetSuggestionDelay(delay) {
    this.updatePreference((preferences) => {
      preferences.suggestionDelay = parseInt(delay, 10) || 0;
      ReplActiveInputActions.updateSuggestionDelay();
    });
  },
  onSetExeTimeout(timeout) {
    this.updatePreference((preferences) => {
      preferences.timeout = parseInt(timeout, 10) || 0;
    });
  },
  getStore() {
    let preferences = JSON.parse(localStorage.getItem('preferences'));
    return _.extend({ open: open }, preferences);
  }
});
export default ReplPreferencesStore;

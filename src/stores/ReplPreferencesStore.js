import ReplPreferencesActions from '../actions/ReplPreferencesActions';
import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';
import _ from 'lodash';

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
    global.preferences = preferences;
    localStorage.setItem('preferences', JSON.stringify(preferences));
    this.trigger();
  },
  toggleGlobalPath(flag) {
    this.updatePreference((preferences) => {
      preferences.global = flag;
    });
  },
  toggleBabel(flag) {
    this.updatePreference((preferences) => {
      preferences.babel = flag;
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
  getStore() {
    let preferences = JSON.parse(localStorage.getItem('preferences'));
    return _.extend({ open: open }, preferences);
  }
});
export default ReplPreferencesStore;

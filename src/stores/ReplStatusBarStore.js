import ReplStatusBarActions from '../actions/ReplStatusBarActions';
import Reflux from 'reflux';

let newRelease = null;
let language = '';
const ReplStatusBarStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplStatusBarActions);
  },
  onUpdateRunCommand() {
    this.trigger();
  },
  onNewRelease(release) {
    newRelease = release;
    this.trigger();
  },
  onUpdateLanguage(lang) {
    language = lang;
    this.trigger();
  },
  getStore() {
    let {toggleShiftEnter, lang} = global.Mancy.preferences;
    return {
      runCommand: toggleShiftEnter,
      newRelease: newRelease,
      lang: language || lang
    };
  }
});
export default ReplStatusBarStore;

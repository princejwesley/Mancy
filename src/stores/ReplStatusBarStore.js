import ReplStatusBarActions from '../actions/ReplStatusBarActions';
import Reflux from 'reflux';

let newRelease = null;
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
  onUpdateLanguage() {
    this.trigger();
  },
  getStore() {
    let {toggleShiftEnter, lang} = global.Mancy.preferences;
    return {
      runCommand: toggleShiftEnter,
      newRelease: newRelease,
      lang: lang
    };
  }
});
export default ReplStatusBarStore;

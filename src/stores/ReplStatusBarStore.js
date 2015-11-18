import ReplStatusBarActions from '../actions/ReplStatusBarActions';
import Reflux from 'reflux';

let newRelease = null;
let language = '';
let mode = '';
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
  onUpdateTranspile() {
    this.trigger();
  },
  onUpdateMode(m) {
    mode = m.toLowerCase();
    this.trigger();
  },
  onRefresh() {
    this.trigger();
  },
  getStore() {
    let {toggleShiftEnter, lang, transpile} = global.Mancy.preferences;
    return {
      runCommand: toggleShiftEnter,
      newRelease: newRelease,
      lang: language || lang,
      mode,
      transpile
    };
  }
});
export default ReplStatusBarStore;

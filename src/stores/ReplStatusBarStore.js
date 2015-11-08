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
  getStore() {
    return {
      runCommand: global.Mancy.preferences.toggleShiftEnter,
      newRelease: newRelease
    };
  }
});
export default ReplStatusBarStore;

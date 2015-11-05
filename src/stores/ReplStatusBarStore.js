import ReplStatusBarActions from '../actions/ReplStatusBarActions';
import Reflux from 'reflux';

let open = false;
const ReplStatusBarStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplStatusBarActions);
  },
  onUpdateRunCommand() {
    this.trigger();
  },
  getStore() {
    return { runCommand: global.Mancy.preferences.toggleShiftEnter };
  }
});
export default ReplStatusBarStore;

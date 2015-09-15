import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';

let entries = [], command = '';
const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(entry) {
    entries.push(entry);
    command = '';
    this.trigger(entry);
  },
  onReloadPrompt(cmd) {
    command = cmd.trim();
    this.trigger(command);
  },
  getStore() {
    return {
      entries: entries,
      command: command
    };
  }

});
export default ReplStore;

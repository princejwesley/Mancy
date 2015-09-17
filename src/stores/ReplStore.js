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
    this.trigger();
  },
  onReloadPrompt(cmd) {
    command = cmd.trim();
    this.trigger();
  },
  onRemoveEntry(idx, entry) {
    entries.splice(idx, 1);
    this.trigger();
  },
  getStore() {
    return {
      entries: entries,
      command: command
    };
  }

});
export default ReplStore;

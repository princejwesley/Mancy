import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';

let entries = [], command = '', cursor = 0;
const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(entry) {
    entries.push(entry);
    command = '';
    cursor = 0;
    this.trigger();
  },
  onReloadPrompt(cmd) {
    command = cmd.command;
    cursor = cmd.cursor;
    this.trigger();
  },
  onRemoveEntry(idx, entry) {
    entries.splice(idx, 1);
    this.trigger();
  },
  getStore() {
    return {
      entries: entries,
      command: command,
      cursor: cursor,
    };
  }

});
export default ReplStore;

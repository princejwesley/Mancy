import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';

let entries = [],
  command = '',
  cursor = 0,
  historyIndex = -1,
  historyStaged = '';

let resetEntry = () => {
  command = '';
  cursor = 0;
  historyIndex = -1;
  historyStaged = '';
}

const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(entry) {
    entries.push(entry);
    resetEntry();
    this.trigger();
  },
  onReloadPrompt(cmd) {
    command = cmd.command;
    cursor = cmd.cursor;
    historyIndex = cmd.historyIndex;
    historyStaged = cmd.historyStaged;
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
      historyIndex: historyIndex,
      historyStaged: historyStaged
    };
  },
  clearStore() {
    entries = [];
    resetEntry();
    this.trigger();
  }

});
export default ReplStore;

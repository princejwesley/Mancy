import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';
import _ from 'lodash';

let cache = {
  entries: [],
  command: '',
  cursor: 0,
  historyIndex: -1,
  historyStaged: '',
  showConsole: false,
  mode: 'REPL_MODE_MAGIC'
};

let resetButEntry = (cmd) => {
  cache = _.extend(cache, cmd || {
    command: '',
    cursor: 0,
    historyIndex: -1,
    historyStaged: ''
  });
}

let collapseOrExpandEntries = (collapsed) => {
  cache.entries.forEach((e) => {
    e.collapsed = collapsed;
  });
};

const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(entry) {
    cache.entries.push(entry);
    resetButEntry();
    this.trigger();
  },
  onReloadPrompt(cmd) {
    resetButEntry(cmd);
    this.trigger();
  },
  onRemoveEntry(idx, entry) {
    cache.entries.splice(idx, 1);
    this.trigger();
  },
  getStore() {
    return cache;
  },
  clearStore() {
    cache.entries = [];
    resetButEntry();
    this.trigger();
  },
  expandAll() {
    collapseOrExpandEntries(false);
    this.trigger();
  },
  collapseAll() {
    collapseOrExpandEntries(true);
    this.trigger();
  },
  setReplMode(type) {
    cache.mode = type;
    this.trigger();
  },
  toggleConsole() {
    cache.showConsole = !cache.showConsole;
    this.trigger();
  }

});
export default ReplStore;

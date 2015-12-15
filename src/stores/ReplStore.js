import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';
import _ from 'lodash';
import ReplCommon from '../common/ReplCommon';

let cache = {
  entries: [],
  history: [],
  command: '',
  cursor: 0,
  historyIndex: -1,
  historyStaged: '',
  showConsole: false,
  showBell: false,
  reloadPrompt: false
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
    e.commandCollapsed = collapsed;
  });
};

const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(entry) {
    cache.entries.push(entry);
    cache.history.push({'plainCode': entry.plainCode})
    cache.reloadPrompt = true;
    resetButEntry();
    this.trigger();
  },
  onReloadPromptByIndex(idx, reverse = false) {
    let length = cache.entries.length;
    let pos = reverse ? length - idx : idx;
    if(pos >= 0 && pos < length) {
      cache.reloadPrompt = true;
      let command = cache.entries[pos].plainCode;
      let cursor = command.length;
      resetButEntry({ command, cursor });
      this.trigger();
    }
  },
  onReloadPrompt(cmd) {
    cache.reloadPrompt = true;
    resetButEntry(cmd);
    this.trigger();
  },
  onRemoveEntry(idx, entry) {
    cache.reloadPrompt = false;
    cache.entries.splice(idx, 1);
    this.trigger();
  },
  onToggleCommandEntryView(idx) {
    cache.reloadPrompt = false;
    let {commandCollapsed} = cache.entries[idx];
    cache.entries[idx].commandCollapsed = !commandCollapsed;
    this.trigger();
  },
  onToggleEntryView(idx) {
    cache.reloadPrompt = false;
    let {collapsed} = cache.entries[idx];
    cache.entries[idx].collapsed = !collapsed;
    this.trigger();
  },
  getStore() {
    return cache;
  },
  clearStore() {
    cache.entries = [];
    resetButEntry();
    cache.showBell = false;
    this.trigger();
  },
  expandAll() {
    cache.reloadPrompt = false;
    collapseOrExpandEntries(false);
    this.trigger();
  },
  collapseAll() {
    cache.reloadPrompt = false;
    collapseOrExpandEntries(true);
    this.trigger();
  },
  onSetREPLMode(mode) {
    cache.reloadPrompt = true;
    this.trigger();
  },
  toggleConsole() {
    cache.showConsole = !cache.showConsole;
    cache.reloadPrompt = false;
    cache.showBell = false;
    this.trigger();
  },
  showBell() {
    cache.reloadPrompt = false;
    cache.showBell = true;
    ReplCommon.beep();
    this.trigger();
  },
  onOverrideLastOutput(output, error) {
    let len = cache.entries.length;
    if(len > 0) {
      let lastEntry = cache.entries[len - 1];
      lastEntry.status = error;
      lastEntry.formattedOutput = output;
      this.trigger();
    }
  },
  onBindObjectToContext(output, formattedOutput) {
    let variable = ReplCommon.getTempVarName();
    ReplCommon.bindToReplContext(variable, output);
    this.onAddEntry({
      formattedOutput,
      status: true,
      command: ReplCommon.highlight(variable),
      plainCode: variable,
    });
  },
});
export default ReplStore;

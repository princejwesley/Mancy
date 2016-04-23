import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';
import _ from 'lodash';
import ReplCommon from '../common/ReplCommon';
import md5 from 'md5';
import {ipcRenderer} from 'electron';

let cache = {
  persistentHistorySize: 0,
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
  onSavePersistentHistory(history = []) {
    cache.persistentHistorySize = history.length;
    cache.history = history.concat(cache.history).map(h => {
      return { plainCode: h, status: false };
    });
    resetButEntry();
  },
  onUpdateEntry(pos, entry) {
    const tag = cache.entries[pos].tag;
    cache.entries[pos] = _.extend({tag}, entry);
    const idx = _.findIndex(cache.history, h => h.tag === tag);
    // overwrite history! :(
    if(idx !== -1) { cache.history[idx].plainCode = entry.plainCode }
    cache.reloadPrompt = false;
    this.trigger();
  },
  onAddEntry(entry) {
    const tag = `${md5(entry.plainCode)}-${Math.random()}`;
    cache.entries.push(_.extend({tag}, entry));
    let {plainCode, internal, js, status} = entry;
    cache.history.push({plainCode, internal, js, tag, status});
    cache.reloadPrompt = true;
    if(global.Mancy.preferences.historyAggressive) {
      ipcRenderer.send('application:history-save', [plainCode]);
    } else {
      ipcRenderer.send('application:history-append', plainCode);
    }
    resetButEntry();
    this.trigger();
  },
  onReloadPromptByIndex(idx, reverse = false) {
    idx = cache.persistentHistorySize + idx;
    let length = cache.history.length;
    let pos = reverse ? length - idx : idx;
    if(pos >= 0 && pos < length) {
      cache.reloadPrompt = true;
      let command = cache.history[pos].plainCode;
      let cursor = command.length;
      resetButEntry({ command, cursor, historyIndex: pos });
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
  onSetEditorMode(mode) {
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

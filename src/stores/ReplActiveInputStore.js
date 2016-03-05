import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';

let activeSuggestion = null;
let now = false;
let breakPrompt = false;
let format = false;
let autoComplete = false;
let stagedCommands = [];

const ReplActiveInputStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActiveInputActions);
  },
  onTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    now = breakPrompt = format = autoComplete = false;
    this.trigger();
  },
  onResetTabCompleteSuggestion() {
    activeSuggestion = null;
    now = breakPrompt = format = autoComplete = false;
    this.trigger();
  },
  onPerformAutoComplete() {
    autoComplete = true;
    this.trigger();
  },
  onFillTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    breakPrompt = format = autoComplete = false;
    now = true;
    this.trigger();
  },
  onBreakPrompt() {
    activeSuggestion = null;
    now = format = autoComplete = false;
    breakPrompt = true;
    this.trigger();
  },
  onFormatCode() {
    format = true;
    autoComplete = false;
    this.trigger();
  },
  onPlayCommands(commands) {
    stagedCommands = commands;
    this.trigger();
  },
  tailStagedCommands() {
    stagedCommands.shift();
    if(stagedCommands.length) {
      this.trigger();
    }
  },
  onSetTheme(t) {
    this.trigger({name: 'theme', value: t});
  },
  onUpdateSuggestionDelay() {
    this.trigger();
  },
  onSetEditorOption(action) {
    this.trigger(action);
  },
  onUndo() {
    this.trigger({action: 'undo'});
  },
  onRedo() {
    this.trigger({action: 'redo'});
  },
  getStore() {
    return {
      activeSuggestion,
      now,
      breakPrompt,
      format,
      stagedCommands,
      autoComplete,
    }
  }
});
export default ReplActiveInputStore;

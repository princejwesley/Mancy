import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';

let activeSuggestion = null;
let now = false;
let breakPrompt = false;
let format = false;
let autoComplete = false;
let theme = null;
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
    theme = t;
    this.trigger();
  },
  onUpdateSuggestionDelay() {
    this.trigger();
  },
  getStore() {
    return {
      activeSuggestion,
      now,
      breakPrompt,
      format,
      stagedCommands,
      autoComplete,
      theme
    }
  }
});
export default ReplActiveInputStore;

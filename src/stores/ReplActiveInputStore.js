import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';

let activeSuggestion = null;
let now = false;
let breakPrompt = false;
let format = false;
let playCommand = false;
let cmdHistory = [];
const ReplActiveInputStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActiveInputActions);
  },
  onTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    playCommand = now = breakPrompt = format = false;
    this.trigger();
  },
  onResetTabCompleteSuggestion() {
    activeSuggestion = null;
    playCommand = now = breakPrompt = format = false;
    this.trigger();
  },
  onFillTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    playCommand = breakPrompt = format = false;
    now = true;
    this.trigger();
  },
  onBreakPrompt() {
    activeSuggestion = null;
    playCommand = now = format = false;
    breakPrompt = true;
    this.trigger();
  },
  onFormatCode() {
    format = true;
    this.trigger();
  },
  onPlayCommands(_history) {
    cmdHistory = _history;
    playCommand = true;
    this.trigger();
  },
  getStore() {
    return {
      activeSuggestion: activeSuggestion,
      now: now,
      breakPrompt: breakPrompt,
      format: format,
      playCommand: playCommand,
      cmdHistory: cmdHistory
    }
  }
});
export default ReplActiveInputStore;

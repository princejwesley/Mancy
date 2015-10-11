import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';

let activeSuggestion = null;
let now = false;
let breakPrompt = false;
let format = false;
let stagedCommands = [];

const ReplActiveInputStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActiveInputActions);
  },
  onTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    now = breakPrompt = format = false;
    this.trigger();
  },
  onResetTabCompleteSuggestion() {
    $console.log('onResetTabCompleteSuggestion')
    activeSuggestion = null;
    now = breakPrompt = format = false;
    this.trigger();
  },
  onFillTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    breakPrompt = format = false;
    now = true;
    this.trigger();
  },
  onBreakPrompt() {
    activeSuggestion = null;
    now = format = false;
    breakPrompt = true;
    this.trigger();
  },
  onFormatCode() {
    format = true;
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
  getStore() {
    return {
      activeSuggestion: activeSuggestion,
      now: now,
      breakPrompt: breakPrompt,
      format: format,
      stagedCommands: stagedCommands
    }
  }
});
export default ReplActiveInputStore;

import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';

let activeSuggestion = null;
let now = false;
let breakPrompt = false;
const ReplActiveInputStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActiveInputActions);
  },
  onTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    now = breakPrompt = false;
    this.trigger();
  },
  onResetTabCompleteSuggestion() {
    activeSuggestion = null;
    now = breakPrompt = false;
    this.trigger();
  },
  onFillTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    breakPrompt = false;
    now = true;
    this.trigger();
  },
  onBreakPrompt() {
    activeSuggestion = null;
    now = false;
    breakPrompt = true;
    this.trigger();
  },
  getStore() {
    return {
      activeSuggestion: activeSuggestion,
      now: now,
      breakPrompt: breakPrompt
    }
  }
});
export default ReplActiveInputStore;

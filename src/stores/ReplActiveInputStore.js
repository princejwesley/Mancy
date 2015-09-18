import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import Reflux from 'reflux';

let activeSuggestion = null;
const ReplActiveInputStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActiveInputActions);
  },
  onTabCompleteSuggestion(suggestion) {
    activeSuggestion = suggestion;
    this.trigger(activeSuggestion);
  },
  onResetTabCompleteSuggestion() {
    activeSuggestion = null;
    this.trigger(activeSuggestion);
  },
  getStore() {
    return { 'activeSuggestion': activeSuggestion }
  }
});
export default ReplActiveInputStore;

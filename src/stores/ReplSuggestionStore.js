import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import Reflux from 'reflux';

let suggestions = [];
const ReplSuggestionStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplSuggestionActions);
  },
  onAddSuggestion(item) {
    suggestions = item;
    this.trigger(suggestions);
  },
  onRemoveSuggestion() {
    suggestions = [];
    this.trigger(suggestions);
  }
});
export default ReplSuggestionStore;

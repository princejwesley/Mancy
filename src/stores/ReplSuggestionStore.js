import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import Reflux from 'reflux';

const ReplSuggestionStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplSuggestionActions);
  },
  onAddSuggestion(item) {
    this.trigger(item);
  },
  onRemoveSuggestion() {
    this.trigger({suggestions:[], input: ''});
  }
});
export default ReplSuggestionStore;

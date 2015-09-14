import ReplConstants from '../constants/ReplConstants';
import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import Reflux from 'reflux';

const ReplSuggestionStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplSuggestionActions);
  },
  onAddSuggestion(item) {
    console.log('add suggestion'. item);
    this.trigger(item);
  },
  onRemoveSuggestion() {
    console.log('remove suggestion')
    this.trigger()
  }
});
export default ReplSuggestionStore;

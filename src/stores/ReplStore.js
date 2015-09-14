import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';

const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(item) {
    this.trigger(item);
  }
});
export default ReplStore;

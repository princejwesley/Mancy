import ReplConstants from '../constants/ReplConstants';
import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';

const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(item) {
    console.log('add entry', item)
    this.trigger({entries: item, action: this});
  }
});
export default ReplStore;

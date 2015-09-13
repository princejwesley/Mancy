import ReplConstants from '../constants/ReplConstants';
import RefluxActions from '../actions/ReplActions';
import Reflux from 'reflux';

const ReplStore = Reflux.createStore({
  init() {
    this.listenTo(RefluxActions.addEntry, this.addEntry);
  },
  addEntry(item) {
    console.log('add entry', item)
  }
});
export default ReplStore;

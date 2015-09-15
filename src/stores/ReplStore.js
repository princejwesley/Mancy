import ReplActions from '../actions/ReplActions';
import Reflux from 'reflux';

let entries = [];
const ReplStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplActions);
  },
  onAddEntry(entry) {
    entries.push(entry);
    this.trigger(entry);
  },
  getEntries() {
    return entries;
  }

});
export default ReplStore;

import ReplConsoleActions from '../actions/ReplConsoleActions';
import Reflux from 'reflux';

let cache = [];
const ReplConsoleStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplConsoleActions);
  },
  onAddEntry(item) {
    //set limit
    item.time = Date.now();
    cache.push(item);
    this.trigger();
  },
  onClear() {
    this.clear();
  },
  clear() {
    cache = [];
    this.trigger();
  },
  getStore() {
    return {
      entries: cache
    }
  }
});
export default ReplConsoleStore;

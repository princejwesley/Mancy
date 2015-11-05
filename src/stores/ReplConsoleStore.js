import ReplConsoleActions from '../actions/ReplConsoleActions';
import Reflux from 'reflux';
import _ from 'lodash';

let cache = [];
const ReplConsoleStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplConsoleActions);
  },
  onAddEntry(item) {
    let dup = false;
    if(cache.length) {
      let lastItem = cache[cache.length - 1];
      item.time = lastItem.time;
      item.count = lastItem.count;
      if(_.isEqual(item, lastItem)) {
        lastItem.count = lastItem.count + 1;
        dup = true;
      }
    }

    if(!dup){
      item.count = 1;
      item.time = Math.random();
      cache.push(item);
    }
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

import _ from 'lodash';
import EventEmitter from 'events';

let console = require('console');
class ReplConsoleHook extends EventEmitter {
  constructor() {
    super();

    _.each(['error', 'warn', 'info', 'log', 'debug'], (fun) => {
      this[fun] = (...rest) => {
        this.emit('console', {type: fun, data: rest});
      };
      console[fun] = this[fun];
    });
  }
}
let hook = new ReplConsoleHook();
export default hook;

import _ from 'lodash';
import EventEmitter from 'events';

class ReplConsoleHook extends EventEmitter {
  constructor() {
    super();
    this.enabled = false;
    this.$console = {};

    _.each(['error', 'warn', 'info', 'log', 'debug'], (fun) => {
      let handle = this.$console[fun] = console[fun];
      this[fun] = (...rest) => {
        if(!this.enabled) {
          handle.apply(console, rest);
        } else {
          this.emit('console', {type: fun, data: rest});          
        }
      };
      console[fun] = this[fun];
    });
  }

  $error(...data) {
    this.$console.error.apply(console, data);
  }

  $warn(...data) {
    this.$console.warn.apply(console, data);
  }

  $info(...data) {
    this.$console.info.apply(console, data);
  }

  $log(...data) {
    this.$console.log.apply(console, data);
  }

  $debug(...data) {
    this.$console.debug.apply(console, data);
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
export default new ReplConsoleHook();

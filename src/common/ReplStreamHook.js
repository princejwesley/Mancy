import _ from 'lodash';
import EventEmitter from 'events';

// only stdout and stderr
class ReplStreamHook extends EventEmitter {
  constructor() {
    super();
    _.each([['stdout', process.stdout], ['stderr', process.stderr]], ([name, stream]) => {
      stream.write = ((stream) => {
        return (chunk, encoding, fd) => {
          this.emit(name, { data: chunk, encoding: encoding, fd: fd });            
        };
      })(stream);
    });
  }
}
export default new ReplStreamHook();

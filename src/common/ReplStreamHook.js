import _ from 'lodash';
import EventEmitter from 'events';

// only stdout and stderr
class ReplStreamHook extends EventEmitter {
  constructor() {
    super();
    this.enabled = false;

    _.each([['stdout', process.stdout], ['stderr', process.stderr]], ([name, stream]) => {
      stream.write = ((stream) => {
        let {write} = stream;
        return (chunk, encoding, fd) => {
          if(!this.enabled) {
            write.apply(stream, [chunk, encoding, fd]);
          } else {
            this.emit(name, { data: chunk, encoding: encoding, fd: fd });            
          }
        };
      })(stream);
    });
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
export default new ReplStreamHook();

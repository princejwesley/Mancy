import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from '../common/ReplCommon';
import ReplEntryOutputError from '../components/ReplEntryOutputError';
import {EOL} from 'os';
import hl from 'highlight.js';
import React from 'react';
import ReplConsoleHook from '../common/ReplConsoleHook';

let ReplOutputType = {
  number: (n) => {
    return <span className='number'>{n}</span>;
  },
  boolean: (b) => {
    return <span className='literal'>{b}</span>;
  },
  array: (a) => {
    let tokenize = (arr, result) => {
      if(arr.length < 100) {
        result.push(arr);
      } else {
        result.push(arr.splice(0, 100));
        tokenize(arr, result);
      }
    };
    let arrays = [];
    tokenize(_.clone(a), arrays);

    // TODO not implemented
  },
  object: (o) => {
    if(Array.isArray(o)) {
      return ReplOutputType.array(o);
    }

    if(_.isRegExp(o)) {
      return ReplOutputType.regexp(o);
    }

    if(_.isNull(0)) {
      return ReplOutputType['null'](o);
    }

    // TODO not implemented
  },
  'undefined': (u) => {
    return <span class='literal'>undefined</span>;
  },
  'function': (f) => {
    // TODO not implemented
  },
  string: (s) => {
    return <span className='string'>{s}</span>;
  },
  symbol: (sy) => {
    return <span className='literal'>{sy.toString()}</span>;
  },
  regexp: (re) => {
    return <span className='regexp'>{re.toString()}</span>;
  },
  'null': () => {
    return <span class='literal'>null</span>;
  }
};

class None {
  constructor() {
    return None.instance;
  }
  highlight(output) {
    let [first, ...rest] = output.split(EOL);
    return {
      formattedOutput:
        <ReplEntryOutputError message={first} trace={rest}>
        </ReplEntryOutputError>,
      error: true
    };
  }
  static instance = new None();
}

class Some {
  constructor(value) {
    this.value = value;
  }
  highlight(output) {
    if(this.value instanceof Error) {
      let [first, ...rest] = this.value.stack.split(EOL);
      return {
        formattedOutput:
          <ReplEntryOutputError message={first} trace={rest}>
          </ReplEntryOutputError>,
        error: false
      };
    }

    return {
      formattedOutput: ReplOutput.transformObject(this.value) || output,
      error: false
    };
  }
}

let ReplOutput = {
  some: (value) => new Some(value),
  none: () => None.instance,
  toJSON: (data) => {
    try {
      return { object: JSON.parse(data) };
    } catch(e) {
      return { error: e.message };
    }
  },
  transformObject: (object) => {
    return ReplOutputType[typeof object](object);
  }

};

export default ReplOutput;

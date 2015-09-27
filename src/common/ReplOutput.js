import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import ReplEntryOutputError from '../components/ReplEntryOutputError';
import {EOL} from 'os';
import React from 'react';
import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplOutputFunction from '../components/ReplOutputFunction';

let ReplOutputType = {
  number: (n) => {
    return <span className='number'>{n}</span>;
  },
  boolean: (b) => {
    return <span className='literal'>{b.toString()}</span>;
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
    return a;
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
    return util.inspect(o);
  },
  'undefined': (u) => {
    return <span class='literal'>undefined</span>;
  },
  'function': (f) => {
    let code = f.toString();
    let funElement = ReplCommon.highlight(code);
    let expandable = false, shortElement = '';
    let idx = code.indexOf(EOL);
    if(idx !== -1) {
      shortElement = ReplCommon.highlight(code.slice(0, idx));
      expandable = true;
    }
    return <ReplOutputFunction html={funElement} expandable={expandable} short={shortElement}/>
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

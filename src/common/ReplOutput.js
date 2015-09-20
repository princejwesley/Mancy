import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from '../common/ReplCommon';
import ReplEntryOutputError from '../components/ReplEntryOutputError';
import {EOL} from 'os';
import hl from 'highlight.js';
import React from 'react';

let ReplOutputType = {
  number: (n) => {
    return <span className='number'>{n}</span>;
  },
  boolean: (b) => {
    return <span className='literal'>{b}</span>;
  },
  array: (a) => {

  },
  object: (o) => {
    if(Array.isArray(o)) {
      return ReplOutputType.array(o);
    }

    return _.chain(o)
      .keys()
      .map((key) => {
        let value = o[key];
        return `
          <span class='object-key'>
            ${key}
          </span>:
          <span class='object-value'>
            ${ReplOutputType[typeof value](value)}
          </span>:
        `
      })
      .value();
  },
  "undefined": (u) => {
    return <span class='literal'>{u}</span>;
  },
  "function": (f) => {

  },
  string: (s) => {
    return <span className='string'>{s}</span>;
  },
  symbol: (sy) => {
    return <span className='literal'>{sy}</span>;
  }
};


let ReplOutput = {
  highlightOutput: (input) => {
    let result = '';
    let output;

    // json
    let {object, error} = ReplOutput.toJSON(input);
    if(!error) {
      return ReplOutput.transformObject(object);
    }

    // plain string
    if(ReplOutput.isPlainString(input)) {
      return ReplOutputType.string(input);
    }

    // error message
    let [first, ...rest] = input.split(EOL);
    if(ReplCommon.isExceptionMessage(first)
      &&  ReplCommon.isStackTrace(rest)) {
      return (
        <ReplEntryOutputError message={first} trace={rest}>
        </ReplEntryOutputError>
      );
    }


    return result;
  },
  isPlainString: (str) => {
    return /^\s*(['"]).*\1\s*$/.test(str);
  },
  toJSON: (data) => {
    try {
      return { object: JSON.parse(data) };
    } catch(e) {
      return { error: e.message };
    }
  },
  transformObject: (object) => {
    let type = typeof object;
    return ReplOutputType[type](object);
  }

};

export default ReplOutput;

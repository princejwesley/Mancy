import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import util from 'util';
import ReplEntryOutputError from '../components/ReplEntryOutputError';
import {EOL} from 'os';
import React from 'react';
import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplOutputFunction from '../components/ReplOutputFunction';
import ReplOutputArray from '../components/ReplOutputArray';
import ReplOutputObject from '../components/ReplOutputObject';

let cycle = Symbol('cycle');

let buildObject = (o) => {
  // 1 arg
  let not = (fn) => (v) => !fn(v);
  let criteria =  [_.compose(not, _.isRegExp), _.compose(not, _.isFunction), _.isObject];
  let isObject = (o) => _.every(criteria, (c) => {
    return c(o);
  });

  if(!isObject(o)) { return o; }

  // queue ops
  let empty = (q) => q.length === 0;
  let enqueue = (q, o) => q.push(o);
  let dequeue = (q) => q.shift();

  let mark = Symbol('mark');
  let keyMark = Symbol('key-mark');
  let valueMark = Symbol('value-mark');
  let newMarker = (o) => {
    return { [mark] = o; };
  };

  let newKeyMarker = () => {
    return { [keyMark]: true };
  };

  let isMarker = (m) => mark in m;
  let isKeyMarker = (m) => keyMark in m;
  let isValueMarker = (m) => valueMark in m;
  let getMarkerValue = (m) => m[mark];
  let notEmpty = _.compose(not, empty);


  let visited = new Set();
  let cache = new Map();
  let base = Array.isArray(o) ? [] : {}, tree;
  let queue = [];


  enqueue(queue, ['', o]);

  while(notEmpty(queue)) {
    let [key, obj] = dequeue(queue);
    if(visited.has(o)) { continue; }
    let objTree = tree ? tree[key] : (tree = base);
    let keys = _.keys(obj);

    visited.add(o);
    _.each(keys, (k) => {
      let value = obj[k];
      if(visited.has(value)) {
        objTree[k] = newMarker(o);
      } else {
        if(isObject(value)) {
          enqueue([k, value]);
          objTree[key] = newKeyMarker();
        } else {
          let cached = cache.has(value);
          if(cached) { objTree[k] = cache.get(value); }
          else {
            objTree[k] = ReplOutput.transformObject(value);
            cache.put(value, objTree[k]);
          }
        }
      }
    });
  }

  cache.put(base, Array.isArray(base)
    ? ReplOutputType.array(base)
    : <ReplOutputObject obj={base}/>);

  _.each(_.keys(base), (k) => {
    enqueue(queue, [k, base[k], base]);
  });
  tree = base;
  while(notEmpty(queue)) {
    let [key, value, objTree] = dequeue(queue);
    if(isMarker(value)) {
      objTree[key] = cache.get(getMarkerValue(value));
    }
    else if(isKeyMarker(value)) {
      let replObject = Array.isArray(value)
        ? ReplOutputType.array(value)
        : <ReplOutputObject obj={value}/>;
      cache.put(value, replObject);
      objTree[key] = replObject;
      _.each(_.keys(value), (k) => {
        enqueue(queue, [k, value[k], value]);
      });
    }
  }

  return cache.get(base);
}

let ReplOutputType = {
  number: (n) => {
    return <span className='number'>{n}</span>;
  },
  boolean: (b) => {
    return <span className='literal'>{b.toString()}</span>;
  },
  array: (a) => {
    let tokenize = (arr, result, range, mul=1) => {
      let len = result.length;
      if(arr.length < range) {
        let label = result.length
          ? ['[',len * range * mul, ' … ', (len * range * mul) - 1 + arr.length % range,']'].join('')
          : ['Array[',arr.length,']'].join('');
        result.push(<ReplOutputArray array={arr} label={label} start={len * range * mul} noIndex={false}/>);
      } else {
        let label = ['[', len * range * mul, ' … ', (len + 1) * range * mul - 1, ']'].join('');
        result.push(<ReplOutputArray array={arr.splice(0, range)} label={label} start={len * range * mul} noIndex={false}/>);
        tokenize(arr, result, range, mul);
      }
    };

    let arr = a;//_.map(a, (e) => ReplOutput.transformObject(e));
    let arrays = [];
    tokenize(arr, arrays, 100);

    if(arrays.length > 100) {
      let arr1000 = [];
      tokenize(arrays, arr1000, 100, 100);
      arrays = arr1000;
    }

    if(arrays.length > 1) {
      return <ReplOutputArray array={arrays}
        label={['Array[',a.length,']'].join('')}
        start={0} noIndex={true}/>
    } else {
      return arrays;
    }
  },
  object: (o) => {
    // if(Array.isArray(o)) {
    //   return ReplOutputType.array(o);
    // }

    if(_.isRegExp(o)) {
      return ReplOutputType.regexp(o);
    }

    if(_.isNull(o)) {
      return ReplOutputType['null'](o);
    }

    // TODO not implemented
    // return util.inspect(o);
    return buildObject(o);
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
      formattedOutput: ReplOutput.transformObject(this.value) || this.value,
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

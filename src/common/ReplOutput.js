import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import util from 'util';
import ReplEntryOutputError from '../components/ReplEntryOutputError';
import {EOL} from 'os';
import React from 'react';
import ReplDOM from '../common/ReplDOM';
import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplOutputFunction from '../components/ReplOutputFunction';
import ReplOutputArray from '../components/ReplOutputArray';
import ReplOutputObject from '../components/ReplOutputObject';
import ReplOutputInteger from '../components/ReplOutputInteger';
import ReplOutputPromise from '../components/ReplOutputPromise';
import ReplOutputRegex from '../components/ReplOutputRegex';
import ReplOutputString from '../components/ReplOutputString';
import ReplOutputColor from '../components/ReplOutputColor';
import ReplOutputURL from '../components/ReplOutputURL';
import ReplOutputCrypto from '../components/ReplOutputCrypto';
import ReplOutputHTML from '../components/ReplOutputHTML';
import ReplOutputBuffer from '../components/ReplOutputBuffer';
import ReplOutputChart from '../components/ReplOutputChart';
import ReplOutputDate from '../components/ReplOutputDate';
import ReplSourceFile from '../components/ReplSourceFile';
import ReplOutputTranspile from '../components/ReplOutputTranspile';
import ReplContext from './ReplContext';

import ReplOutputCljsVar from '../components/clojurescript/ReplOutputCljsVar';
import ReplOutputCljsSeq from '../components/clojurescript/ReplOutputCljsSeq';
import ReplOutputCljsDoc from '../components/clojurescript/ReplOutputCljsDoc';
import ReplOutputCljsDocs from '../components/clojurescript/ReplOutputCljsDocs';
import ReplOutputCljsSource from '../components/clojurescript/ReplOutputCljsSource';

let Debug = require('vm').runInDebugContext('Debug');
let makeMirror = (o) => Debug.MakeMirror(o, true);
let BabelCoreJS = require("babel-runtime/core-js");

let getObjectLabels = (o) => {
  if(o._isReactElement) {
    return ' ReactElement {}';
  }

  if(o instanceof Error) {
    return ` ${o.name} {}`;
  }

  if(Buffer.isBuffer(o)) {
    return ` Buffer (${o.length} bytes) {}`;
  }

  return null;
}

let ReplOutputType = {
  promise: (status, value, p) => {
    return <ReplOutputPromise initStatus={status} initValue={value} promise={p}/>;
  },
  buffer: (buf) => {
    return <ReplOutputBuffer buffer={buf} image={ReplCommon.getImageData(buf)}/>;
  },
  primitive: (n, type) => {
    let prefix = `${type} {`;
    let suffix = '}';
    let className = type === 'Number' ? 'cm-number' : 'cm-literal';
    return (
      <span className='primitive-object'>
        {prefix}
        <span className='primitive-key'>[[PrimitiveValue]]</span>:
        <span className={className}>{n.toString()}</span>
        {suffix}
      </span>);
  },
  number: (n) => {
    if(_.isFinite(n) && ((n | 0) === n)) {
      // integers
      return <ReplOutputInteger int={n} />
    }
    return <span className='cm-number'>{n}</span>;
  },
  boolean: (b) => {
    return <span className='cm-atom'>{b.toString()}</span>;
  },
  array: (a, meta = { type: 'Array', proto: Array.prototype }) => {
    let tokenize = (arr, result, range, mul=1) => {
      let len = result.length;
      if(arr.length < range) {
        let label = result.length
          ? ['[',len * range * mul, ' … ', (len * range * mul) - 1 + arr.length % range,']'].join('')
          : [meta.type, '[',arr.length,']'].join('');
        result.push(<ReplOutputArray proto={meta.proto}
          array={arr} label={label} start={len * range * mul} noIndex={false}/>);
      } else {
        let label = ['[', len * range * mul, ' … ', (len + 1) * range * mul - 1, ']'].join('');
        result.push(<ReplOutputArray proto={meta.proto}
          array={arr.splice(0, range)} label={label} start={len * range * mul} noIndex={false}/>);
        tokenize(arr, result, range, mul);
      }
    };

    let arr = _.clone(a);
    let arrays = [];
    tokenize(arr, arrays, 100);

    if(arrays.length > 100) {
      let arr1000 = [];
      tokenize(arrays, arr1000, 100, 100);
      arrays = arr1000;
    }

    if(arrays.length > 1) {
      return <ReplOutputArray array={arrays}
        label={[meta.type,'[',a.length,']'].join('')}
        proto={meta.proto}
        start={0} noIndex={true} length={a.length}/>
    } else {
      return arrays;
    }
  },
  date: (d) => {
    return <ReplOutputDate date={d} />
  },
  object: (o) => {
    if(Array.isArray(o)){
      return ReplOutputType.array(o);
    }

    if(Buffer.isBuffer(o) || ReplCommon.isUint8Array(o)) {
      return ReplOutputType['buffer'](o);
    }

    if(ReplCommon.isTypedArray(o)) {
      let arrayLike = ReplCommon.toArray(o);
      return ReplOutputType.array(arrayLike, {type: ReplCommon.type(o), proto: o.__proto__});
    }

    if(_.isDate(o)) {
      return ReplOutputType.date(o);
    }

    if(_.isRegExp(o)) {
      return ReplOutputType.regexp(o);
    }

    if(_.isNull(o)) {
      return ReplOutputType['null'](o);
    }

    if(_.isNumber(o)) {
      return ReplOutputType['primitive'](o, 'Number');
    }

    if(_.isBoolean(o)) {
      return ReplOutputType['primitive'](o, 'Boolean');
    }

    if(o instanceof Promise || o.then) {
      if(o instanceof BabelCoreJS.default.Promise) {
        let obj = o[Object.getOwnPropertyNames(o)[0]];
        let status = obj.s === 0 ? 'pending' : (obj.s === 1 ? 'resolved' : 'rejected');
        return ReplOutputType['promise'](status, obj.v, o);
      } else {
        let m = makeMirror(o);
        if(m.isPromise()) {
          return ReplOutputType['promise'](m.status(), m.promiseValue().value(), o);
        }
      }
    }

    if(ReplCommon.candidateForChart(o)) {
      return <ReplOutputChart chart={o}/>;
    }
    return <ReplOutputObject object={o} label={getObjectLabels(o)} primitive={_.isString(o)}/>
  },
  'undefined': (u) => {
    return <span className='cm-atom'>undefined</span>;
  },
  'function': (f) => {
    let code = f.toString();
    let funElement = ReplCommon.highlight(code, 'js');
    let expandable = false, shortElement = '';
    let idx = code.indexOf(EOL);
    if(idx !== -1) {
      shortElement = ReplCommon.highlight(code.slice(0, idx), 'js');
      expandable = true;
    }
    return <ReplOutputFunction html={funElement} fun={f} expandable={expandable} short={shortElement}/>
  },
  string: (s) => {
    // string is a color
    if(ReplCommon.isCSSColor(s)) {
      return <ReplOutputColor str={s}/>;
    }

    if(ReplCommon.isURL(s)) {
      return <ReplOutputURL url={s}/>;
    }

    if(ReplCommon.isBase64(s)) {
      let decode = ReplCommon.decodeBase64(s);
      let dom = (typeof decode === 'string')
        ? <ReplOutputString str={decode}/>
        : ReplOutputType['buffer'](decode);
      return <ReplOutputCrypto type='base64' encode={<ReplOutputString str={s}/>} decode={dom}/>;
    }

    let body = ReplDOM.toHTMLBody(s);
    if(body) {
      let source = <ReplOutputString str={s} limit={ReplConstants.OUTPUT_TRUNCATE_LENGTH / 2}/>;
      return <ReplOutputHTML body={body} source={source}/>;
    }

    return <ReplOutputString str={s}/>;
  },
  symbol: (sy) => {
    return <span className='cm-variable'>{sy.toString()}</span>;
  },
  regexp: (re) => {
    return <ReplOutputRegex regex={re} />;
  },
  'null': () => {
    return <span className='cm-atom'>null</span>;
  }
};

// wrapper for clojure output
class ClojureWrapper {
  constructor(value, hint) {
    this.value = value;
    this.hint = hint;
  }

  toJS() {
    const {cljs} = ReplContext.getContext();
    return cljs.core.clj__GT_js(this.value)
  }

  toWrappedArray() {
    let arr = [];
    for(let val of this.value) {
      arr.push(val);
    }
    return arr;
  }

  toWrappedArray2() {
    let arr = [];
    for(let val of this.value) {
      for(let v2 of val) {
        arr.push(v2);
      }
    }
    return arr;
  }

  core() {
    return ReplContext.getContext().cljs.core;
  }

  seqBuilder(a, token = { prefix: '(', suffix: ')', type: 'list' }) {
    let tokenize = (arr, result, range, mul=1) => {
      let len = result.length;
      if(arr.length < range) {
        result.push(<ReplOutputCljsSeq token={token}
          array={arr} start={len * range * mul}/>);
      } else {
        result.push(<ReplOutputCljsSeq token={token}
          array={arr.splice(0, range)} start={len * range * mul}/>);
        tokenize(arr, result, range, mul);
      }
    };

    let arr = _.clone(a);
    let arrays = [];
    tokenize(arr, arrays, 100);

    if(arrays.length > 100) {
      let arr1000 = [];
      tokenize(arrays, arr1000, 100, 100);
      arrays = arr1000;
    }

    if(arrays.length > 1) {
      return <ReplOutputCljsSeq array={arrays}
        token={token}
        start={0} length={a.length}/>
    } else {
      return arrays;
    }
  }


  string() {
    return ReplOutputType.string(this.value);
  }

  number() {
    return ReplOutputType.number(this.value);
  }

  boolean() {
    return ReplOutputType.boolean(this.value);
  }

  keyword() {
    return <span className='cm-atom'>{this.value.toString()}</span>;
  }

  symbol() {
    return <span className='cm-variable'>{this.value.str}</span>;
  }

  map() {
    return this.seqBuilder(this.toWrappedArray2(), { prefix: '{', suffix: '}', type: 'map' });
  }

  seq() {
    const {cljs} = ReplContext.getContext();
    const isQueue = this.value instanceof cljs.core.PersistentQueue;
    const seqInfo = isQueue ? { prefix: '[', 'suffix': ']', type: 'queue' } : { prefix: '(', suffix: ')', type: 'seq' };
    return this.seqBuilder(this.toWrappedArray(), seqInfo);
  }

  list() {
    return this.seqBuilder(this.toWrappedArray(), { prefix: '(', suffix: ')', type: 'list' });
  }

  vector() {
    return this.seqBuilder(this.toWrappedArray(), { prefix: '[', suffix: ']', type: 'vector' });
  }

  set() {
    return this.seqBuilder(this.toWrappedArray(), { prefix: '#{', suffix: '}', type: 'set' });
  }

  array() {
    return this.seqBuilder(this.value, { prefix: '[', suffix: ']', type: '#js array' });
  }

  var() {
    return <ReplOutputCljsVar core={this.core()} value={this.value}/>;
  }

  nil() {
    return <span className='cm-atom'>nil</span>;
  }

  'function'() {
    // no meta info available to render differently
    return ReplOutputType['function'](this.value);
  }

  'undefined'() {
    return this.nil();
  }

  object() {
    const {cljs} = ReplContext.getContext();
    const views = [ 'keyword', 'symbol', 'nil', 'vector', 'list', 'set', 'map', 'array', 'seq'];

    for(let v = 0; v < views.length; v++) {
      if(cljs.core[`${views[v]}_QMARK_`](this.value)) {
        return this[views[v]]();
      }
    }

    if(this.value instanceof cljs.core.Var) {
      return this.var();
    }

    return ReplOutputType.object(this.value);
  }

  "find-doc"() {
    let value = this.value.replace(/^-+\s/, '');
    let docs = this.value.split(/^-+\s/m).filter(x => !!x.length);
    let result = _.map(docs, (doc, idx) => {
      let [name, definition, ...description] = doc.split('\n');
      return (<ReplOutputCljsDoc name={name} open={idx === 0}
              definition={ReplCommon.highlight(definition)}
              description={description.join('\n')} />);
    });
    return <ReplOutputCljsDocs docs={result} />;
  }

  doc() {
    return this["find-doc"]();
  }

  source() {
    let value = this.value || '\n';
    let short = <ReplOutputString str={value.slice(0, value.indexOf('\n'))}
      limit={ReplConstants.OUTPUT_TRUNCATE_LENGTH / 2}/>;

    return <ReplOutputCljsSource short={short} source={ReplCommon.highlight(this.value)}/>
  }

  specialForm() {
    let action = this[this.hint] || this.object;
    return action.call(this);
  }

  view() {
    return this.hint ? this.specialForm() : this[typeof this.value]();
  }
}

class None {
  constructor() {
    return None.instance;
  }
  getValue() { return void 0; }
  highlight(output = '') {
    let [first, ...rest] = (output.stack || output.toString()).split(EOL);
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
  getValue() { return this.value; }
  highlight(output) {
    if(_.isError(this.value)) {
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
  asObject: (object, type) => {
    if(ReplOutputType[type]) {
      return ReplOutputType[type](object);
    }
  },
  accessError: (e) => {
    return (
      <span className='read-error'>
        [[Get Error]] {ReplOutputType[typeof e](e)}
      </span>);
  },
  transformObject: (object) => {
    try {
      if(object instanceof ClojureWrapper) {
        return object.view();
      }
      return ReplOutputType[typeof object](object);
    } catch(e) {
      return ReplOutput.accessError(e);
    }
  },
  readProperty: (obj, prop) => {
    try {
      return obj && obj[prop];
    } catch(e) {
      return ReplOutput.accessError(e);
    }
  },
  source: (mod) => {
    let context = ReplContext.getContext();
    return (
      <ReplSourceFile
        location= {ReplCommon.getModuleSourcePath(mod, context.module.paths)}
        name={mod}
      />
    );
  },
  clojure: (value, hint = null) => {
    return new ClojureWrapper(value, hint);
  },
  isInstanceOfClojure: (object) => object instanceof ClojureWrapper,
  transpile: (output) => {
    let html = ReplCommon.highlight(output, 'js', true);
    return <ReplOutputTranspile html={html} output={output} />
  }
};

export default ReplOutput;

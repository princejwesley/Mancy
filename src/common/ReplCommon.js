import _ from 'lodash';
import hl from 'highlight.js';
import ReplConstants from '../constants/ReplConstants';
import shell from 'shell';
import fs from 'fs';
import vm from 'vm';
import {resolve} from 'path';
import esprima from 'esprima';
import escodegen from 'escodegen';
import module from 'module';
import ReplContext from '../common/ReplContext';
import IsCSSColor from 'is-css-color';

const funPattern = /^\s*((?:function\s)?\s*[^)]+\))/;
// http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
const urlPattern = /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/i;
//http://stackoverflow.com/questions/8571501/how-to-check-whether-the-string-is-base64-encoded-or-not
const base64Pattern = /^([a-z0-9+/]{4})*([a-z0-9+/]{4}|[a-z0-9+/]{3}=|[a-z0-9+/]{2}==)$/i;

const typedArrays = [
  Int8Array, Int16Array, Int32Array,
  Uint8Array, Uint8ClampedArray, Uint16Array,
  Uint32Array, Float32Array, Float64Array
];

const typedArraysLike = [
  'Int8Array', 'Int16Array', 'Int32Array',
  'Uint8Array', 'Uint8ClampedArray', 'Uint16Array',
  'Uint32Array', 'Float32Array', 'Float64Array'
];

// used to create temporary variable
let tempCounter = 0;

let ReplCommon = {
  times: (num, str) => {
    return new Array(num + 1).join(str);
  },
  highlight: (code) => {
    return hl.highlight(global.Mancy.preferences.lang, code, true).value;
  },
  isExceptionMessage: (msg) => {
    return /Error:?/.test(msg);
  },
  isStackTrace: (trace) => {
    return !!trace && trace.length > 0 && trace.every((t, idx) => {
      return /^\s+at\s/.test(t) || (/^$/.test(t) && trace.length === idx + 1);
    });
  },
  toWords: (str) => {
    return str.split(/\s/);
  },
  toArray: (arrayLike) => {
    return Array.prototype.slice.call(arrayLike);
  },
  trimRight: (str) => {
    return str.replace(/\s+$/, '');
  },
  isObjectString: (str) => {
    return /^.*\./.test(str);
  },
  reverseString: (str) => {
    return str.split('').reverse().join('');
  },
  linesLength: (arr) => {
    return _.reduce(arr, (result, line) => {
      return result + line.length;
    }, 0) + arr.length;
  },
  getUsername: () => {
    return (process.platform === 'win32')
      ? process.env.USERNAME
      : process.env.USER;
  },
  beep: () => { shell.beep(); },
  format: (code) => {
    try {
      // comments?
      let syntax = esprima.parse(code, { comment: true, raw: true, tokens: true, range: true });
      syntax = escodegen.attachComments(syntax, syntax.comments, syntax.tokens);
      return escodegen.generate(syntax, esCodeGenOptions);
    } catch(e) {}
    return code;
  },
  addToPath: (paths, context = this) => {
    //TODO duplicate check
    let newPaths = Array.isArray(paths) ? paths : [paths];
    context.module.paths = newPaths.concat(context.module.paths);
  },
  escapseRegExp: (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
  divide: (str, pos) => {
    return [str.substring(0, pos), str.substring(pos)];
  },
  sortTabCompletion: (context, completion) => {
    let keys = _.difference(_.keys(context), ReplContext.builtIns());
    let user = [], sys = [];
    _.each(_.sortBy(completion), (c) => {
      let container = keys.indexOf(c) == -1 ? sys : user;
      container.push(c);
    });
    return user.concat(sys);
  },
  getModuleSourcePath: (request, paths) => {
    return module._findPath(request, paths);
  },
  addUserDataToPath: (context) => {
    //TODO duplicate check
    context.module.paths = context.module.paths.concat([resolve(global.Mancy.userData, 'node_modules')]);
  },
  getNativeModules: (context) => {
    return _.chain(context.process.moduleLoadList)
      .filter((module) => module.startsWith('NativeModule '))
      .map((module) => module.replace(/NativeModule\s/, ''))
      .value();
  },
  shouldTriggerAutoComplete: (e) => {
    if(typeof e === 'string') {
      e = { which: e.charCodeAt(0), shiftKey: true };
    }
    let keyCode = e.which;
    let notAllowed = [123, 125, 13, 59, 61, 10, 37, 38, 39, 40, 219, 221]; // CR;=LF(direction)[]
    let shiftNotAllowed = [57, 48, 91, 93, 123, 125, 188, 190]; // (){}<>
    if((notAllowed.indexOf(keyCode) !== -1) ||
      (e.shiftKey && shiftNotAllowed.indexOf(keyCode) !== -1)){
      return false;
    }

    return true;
  },
  type: (obj) => {
    //http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
    let name = Object.prototype.toString.call(obj).slice(8, -1);
    if(name === 'Object' && obj && obj.constructor && obj.constructor.name) {
      return obj.constructor.name;
    }
    return name;
  },
  funType: (fun) => {
    let code = fun.toString();
    let result = code.match(funPattern);
    if(result && result.length == 2) {
      return result[1];
    }
    return /^\s*function/.test(code) ? 'function ()' : '()';
  },
//  isPrintableAscii: (char) => /[ -~]/.test(char),
  isPrintableAscii: (str) => !_.find(str, (c) => {
    if(c === '\n' || c === '\r' || c === '\t') { return false; }
    let charCode = c.charCodeAt(0);
    return charCode < 0x20 || charCode > 0x7e;
  }),
  isCSSColor: (color) => {
    let cssValues = ['transparent', 'initial', 'inherit', 'currentColor'];
    return IsCSSColor(color) && cssValues.indexOf(color.toLowerCase()) === -1;
  },
  isURL: (url) => !!url.match(urlPattern),
  isBase64: (encoded) => !!encoded.match(base64Pattern),
  decodeBase64: (encoded) => {
    let data = new Buffer(encoded, 'base64');
    let str = data.toString('utf8');
    return ReplCommon.isPrintableAscii(str) ? str : data;
  },
  getImageData: (buffer) => {
    if(!buffer) { return null; }
    if(ReplCommon.isJPEG(buffer)) { return { type: 'image/jpeg', base64: buffer.toString('base64') }; }
    if(ReplCommon.isPNG(buffer)) { return { type: 'image/png', base64: buffer.toString('base64') }; }
    if(ReplCommon.isGIF(buffer)) { return { type: 'image/gif', base64: buffer.toString('base64') }; }
    if(ReplCommon.isWEBP(buffer)) { return { type: 'image/webp', base64: buffer.toString('base64') }; }
    if(ReplCommon.isBMP(buffer)) { return { type: 'image/bmp', base64: buffer.toString('base64') }; }
    return null;
  },
  // guesses
  isJPEG: (buffer) => {
    return (buffer && buffer.length > 4 && buffer[0] === 0xff
      && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff
      && buffer[buffer.length - 1] === 0xd9);
  },
  isPNG: (buffer) => {
    return (buffer && buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50
      && buffer[2] === 0x4e && buffer[3] === 0x47 && buffer[4] === 0x0d
      && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
    );
  },
  isGIF: (buffer) => {
    return (buffer && buffer.length > 6 && buffer[0] === 0x47 && buffer[1] === 0x49
      && buffer[2] === 0x46 && buffer[3] === 0x38 && (buffer[4] === 0x37
      || buffer[4] === 0x39) &&  buffer[5] === 0x61
    );
  },
  isWEBP: (buffer) => {
    return (buffer && buffer.length > 12 && buffer[8] === 0x57
      && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50);
  },
  isBMP: (buffer) => {
    if(!buffer || !buffer.length < 14) {
      return false;
    }
    let size = ((buffer[5] << 24) | (buffer[4] << 16) | (buffer[3] << 8) | buffer[2]);
    return ((buffer.length === 14 + size) && buffer[0] === 0x42 && buffer[1] === 0x4d);
  },
  isFile: (file) => {
    try {
      return fs.statSync(file).isFile();
    } catch (e) {
      return false;
    }
  },
  isGridData: (v) => {
    return !!_.find([_.isNumber, _.isString, _.isDate, _.isBoolean], (fun) => fun(v));
  },
  candidateForGrid: (o) => {
    if(typeof o !== 'object') { return false; }

    let keys = _.keys(o);
    if(!keys.length) { return false; }
    let [first, rest] = keys;
    if(typeof o[first] !== 'object' || _.isNull(o[first])) { return false; }
    let cols = _.keys(o[first]);
    if(!_.all(_.values(o[first]), ReplCommon.isGridData)) { return false; }
    if(!cols.length) { return false; }
    return !_.find(rest, (e) => {
      let cs = _.keys(o[e]);
      return (cs.length != cols.length)
        ||  !_.isEqual(cols, cs)
        || !_.all(_.values(o[e]), ReplCommon.isGridData);
    });
  },
  candidateForChart: (o) => {
    if(typeof o !== 'object') { return false; }

    let keys = _.keys(o);
    if(!keys.length) { return false; }
    let data = 0;
    let invalid = _.find(keys, (k) => {
      let v = o[k];
      if(!Array.isArray(v)) { return true; }
      if(_.find(v, (d) => !(typeof d === 'number' || _.isDate(d)))) { return true; }
      data += v.length;
      return false;
    });

    return !invalid && data > 0;
  },
  isTypedArrayInstance: (o) => !!typedArrays.find((ta) => o instanceof ta),
  isTypedArrayLike: (o) => typedArraysLike.indexOf(ReplCommon.type(o)) !== -1,
  isTypedArray: (o) => ReplCommon.isTypedArrayInstance(o) || ReplCommon.isTypedArrayLike(o),
  runInContext: (js, cb) => {
    try {
      cb(null, vm.runInContext(js, ReplContext.getContext(), 'repl'));
    } catch(e) {
      cb(e);
    }
  },
  getTempVarName: () => `temp${++tempCounter}`,
  bindToReplContext: (variable, value) => ReplContext.getContext()[variable] = value,
};

let esCodeGenOptions = {
  comment: true,
  format: {
    indent: {
      style: ReplCommon.times(ReplConstants.TAB_WIDTH, ' ')
    },
    quotes: 'auto'
  }
};

hl.configure({
  tabReplace: ReplCommon.times(ReplConstants.TAB_WIDTH, ' '),
  classPrefix: ''
});

export default ReplCommon;

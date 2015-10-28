import _ from 'lodash';
import hl from 'highlight.js';
import ReplConstants from '../constants/ReplConstants';
import shell from 'shell';
import {resolve} from 'path';
import esprima from 'esprima';
import escodegen from 'escodegen';
import module from 'module';
import ReplContext from '../common/ReplContext';
import IsCSSColor from 'is-css-color';

const funPattern = /^\s*((?:function\s)?\s*[^)]+\))/;
// http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
const urlPattern = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
//http://stackoverflow.com/questions/8571501/how-to-check-whether-the-string-is-base64-encoded-or-not
const base64Pattern = /^([a-z0-9+/]{4})*([a-z0-9+/]{4}|[a-z0-9+/]{3}=|[a-z0-9+/]{2}==)$/i;

let ReplCommon = {
  times: (num, str) => {
    return new Array(num + 1).join(str);
  },
  highlight: (code) => {
    return hl.highlight('js', code, true).value;
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
    _.each(completion, (c) => {
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
    let keyCode = e.which;
    let notAllowed = [123, 125, 40, 41, 13, 59, 61, 10];
    if(notAllowed.indexOf(keyCode) !== -1) {
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
  isPrintableAscii: (char) => /[ -~]/.test(char),
  isPrintableAsciiString: (str) => (/^[ -~]*$/mg).test(str),
  isCSSColor: (color) => {
    let cssValues = ['transparent', 'initial', 'inherit', 'currentColor'];
    return IsCSSColor(color) && cssValues.indexOf(color.toLowerCase()) === -1;
  },
  isURL: (url) => !!url.match(urlPattern),
  isBase64: (encoded) => !!encoded.match(base64Pattern),
  decodeBase64: (encoded) => {
    let data = new Buffer(encoded, 'base64');
    let str = data.toString('utf8');
    return ReplCommon.isPrintableAsciiString(str) ? str : data;
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
  }
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

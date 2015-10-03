import _ from 'lodash';
import hl from 'highlight.js';
import ReplConstants from '../constants/ReplConstants';
import shell from 'shell';
import esprima from 'esprima';
import escodegen from 'escodegen';
import module from 'module';

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
  addToPath: (paths) => {
    let newPaths = Array.isArray(paths) ? paths : [paths];
    module.globalPaths = newPaths.concat(module.globalPaths);
  },
  escapseRegExp: (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

import _ from 'lodash';
import hl from 'highlight.js';
import ReplConstants from '../constants/ReplConstants';
import shell from 'shell';
import {resolve} from 'path';
import esprima from 'esprima';
import escodegen from 'escodegen';
import module from 'module';
import ReplContext from '../common/ReplContext';

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
  //http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
  type: (obj) => Object.prototype.toString.call(obj).slice(8, -1),
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

import _ from 'lodash';
import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplConstants from '../constants/ReplConstants';
import vm from 'vm';
import fs from 'fs';
import {dirname, resolve} from 'path';
import timers from 'timers';
import module from 'module';
import util from 'util';

let execSync = require('child_process').execSync;
let cxt = null;
let systemVariables = [];
let npmExe = resolve('node_modules', '.bin', 'npm');

let getPreferences = () => global.Mancy.preferences;
let noop = () => {};
let unlinkFun = noop;
let unlink = () => { (unlinkFun || noop)(); };

let unlinkContext = (fun) => {
  unlinkFun = fun;
}

let createContext = () => {
  if(cxt) { return cxt; }
  // sandbox
  let context = vm.createContext();
  let defaults = [
    'process',
    'Buffer',
    'console',
    'module',
    'require',
    '__filename',
    '__dirname'
  ];

  let circulars = [ '_', 'global', 'GLOBAL', 'root'];

  _.each(defaults, (g) => {
    context[g] = global[g];
  });

  _.each(circulars, (g) => {
    context[g] = context;
  });

  _.each(['error', 'warn', 'info', 'log', 'debug'], (fun) => {
    context.console[fun] = ReplConsoleHook[fun];
  });

  let timerFuns = [ 'clearImmediate', 'clearInterval', 'clearTimeout',
    'setImmediate', 'setInterval', 'setTimeout' ];

  _.each(timerFuns, (fun) => {
    context[fun] = timers[fun];
  });

  context.process.on('uncaughtException', function (err) {
    console.error(new Error(err));
  });

  let {createScript} = vm;
  vm.createScript = (code, options) => {
    try {
      let {timeout} = getPreferences();
      let cxt = createScript(code, options);
      let runInContext = cxt.runInContext.bind(cxt);
      cxt.runInContext = (contextifiedSandbox, options) => {
        return runInContext(contextifiedSandbox, {
          displayErrors: false,
          timeout: timeout
        });
      };
      global.Mancy.REPLError = null;
      return cxt;
    } catch(e) {
      if(e instanceof SyntaxError) {
        global.Mancy.REPLError = e;
      }
      throw e;
    }
  };

  let _load = module._load;
  module._load = (request, parent, isMain) => {
    try {
      return _load(request, parent, isMain);
    } catch(e) {
      let path = dirname(parent.paths[parent.paths.length - 1]);
      try {
        let child = execSync(`${npmExe} install ${request}`,
          { cwd: `${path}`, stdio:[], timeout: global.Mancy.preferences.timeout });
        return _load(request, parent, isMain);
      } catch(ex) {
        throw e;
      }
    }
  };


  let debuglog = util.debuglog;
  util.debuglog = (name) => {
    if(name === 'repl') {
      return (fun, e, ret) => {
        if(fun === 'finish' && !e) {
          // unlink context
          unlink();
        }
      };
    }
    return debuglog(name);
  };

  systemVariables = _.keys(context);

  return (cxt = context);
};

let getContext = () => {
  return cxt ? cxt : createContext();
};

let builtIns = () => {
  return systemVariables;
};

createContext();
export default { createContext: createContext, getContext: getContext, builtIns: builtIns, unlinkContext: unlinkContext };

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
let npmExe = resolve(__dirname, 'node_modules', '.bin', 'npm');

let getPreferences = () => global.Mancy.preferences;
let noop = () => {};
let linkFun = noop;
let link = (context) => { (linkFun || noop)(context); };

let hookContext = (fun) => {
  linkFun = fun;
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

  let circulars = ['global', 'GLOBAL', 'root'];

  _.each(defaults, (g) => {
    context[g] = global[g];
  });

  _.each(circulars, (g) => {
    context[g] = context;
  });

  context.console = require('console');
  _.each(['error', 'warn', 'info', 'log', 'debug'], (fun) => {
    context.console[fun] = ReplConsoleHook[fun];
  });

  let timerFuns = [ 'clearImmediate', 'clearInterval', 'clearTimeout',
    'setImmediate', 'setInterval', 'setTimeout' ];

  _.each(timerFuns, (fun) => {
    context[fun] = timers[fun];
  });

  context.process.on('uncaughtException', function (err) {
    console.error(err);
  });

  // load builtIns
  let builtins = require('repl')._builtinLibs;
  _.each(builtins, (name) => {
    Object.defineProperty(context, name, {
      get: () => (context[name] = require(name)),
      set: (val) => {
        delete context[name];
        context[name] = val;
      },
      configurable: true
    });
  });

  let _load = module._load;
  module._load = (request, parent, isMain) => {
    try {
      return _load(request, parent, isMain);
    } catch(e) {
      let path = dirname(parent.paths[parent.paths.length - 1]);
      try {
        let child = execSync(`npm install ${request}`,
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
          link({});
        }
        else if(fun === 'line %j') {
          // link context
          link(context);
        }
      };
    }
    return debuglog(name);
  };

  systemVariables = _.keys(context);

  if(process.platform !== 'win32' && context.process.env.PATH.indexOf() == -1) {
    context.process.env.PATH += ':/usr/local/bin';
  }

  // TODO: revisit
  // commented because of #101 issue

  // try {
  //   let code =`
  //     (() => {
  //       var poly = require('core-js/shim');
  //       Object.getOwnPropertyNames(poly).forEach(function(obj) {
  //         if(!this[obj]) { this[obj] = poly[obj]; }
  //         else {
  //           Object.getOwnPropertyNames(poly[obj]).forEach(function(p) {
  //             if(poly[obj][p] && !this[obj][p]) {
  //               this[obj][p] = poly[obj][p];
  //             }
  //           });
  //         }
  //       });
  //     })();
  //   `
  //   let script = vm.createScript(code, {
  //     filename: 'mancy-repl',
  //     displayErrors: false,
  //   });
  //   script.runInContext(context, { displayErrors: false });
  // } catch(e) {
  //   console.log(e);
  // }

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

  return (cxt = context);
};

let getContext = () => {
  return cxt ? cxt : createContext();
};

let builtIns = () => {
  return systemVariables;
};

const alphaNames = Object.getOwnPropertyNames(createContext());
export default { createContext, getContext, builtIns, hookContext, alphaNames };

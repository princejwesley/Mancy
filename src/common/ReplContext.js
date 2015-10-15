import _ from 'lodash';
import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplConstants from '../constants/ReplConstants';
import vm from 'vm';
import timers from 'timers';

let cxt = null;
let systemVariables = [];

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
    let timeout = ReplConstants.EXEC_TIMEOUT; // TODO use preference
    let cxt = createScript(code, options);
    let runInContext = cxt.runInContext.bind(cxt);
    cxt.runInContext = (contextifiedSandbox, options) => {
      return runInContext(contextifiedSandbox, {
        displayErrors: false,
        timeout: timeout
      });
    };
    return cxt;
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

export default { createContext: createContext, getContext: getContext, builtIns: builtIns };

import _ from 'lodash';
import ReplConsoleHook from '../common/ReplConsoleHook';
import vm from 'vm';
import timers from 'timers';

let cxt = null;

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

  return (cxt = context);
};

let getContext = () => {
  return cxt ? cxt : createContext();
};

export default { createContext: createContext, getContext: getContext };

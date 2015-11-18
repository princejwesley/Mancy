import {Readable, Writable} from 'stream';
import ReplContext from '../common/ReplContext';
import ReplConstants from '../constants/ReplConstants';
import ReplOutput from '../common/ReplOutput';

import jsREPL from 'repl';
import coffeeREPL from 'coffee-script/repl';
import tsREPL from './ReplTypeScript';
import lsREPL from './ReplLiveScript';

const REPL = (repl) => {
  let readable = new Readable();
  let writable = new Writable();

  readable._read = writable.write = () => {};

  let nodeRepl = repl.start({
    prompt: '',
    input: readable,
    output: writable,
    terminal: false,
    useGlobal: false,
    ignoreUndefined: false,
    useColors: false,
    writer: (obj, opt) => {
      nodeRepl.$lastExpression = ReplOutput.some(obj);
      // link context
      nodeRepl.context = ReplContext.getContext();
      return '<<response>>';
    },
    historySize: ReplConstants.REPL_HISTORY_SIZE,
    replMode: repl['REPL_MODE_MAGIC'],
  });

  // here is our sandbox environment
  nodeRepl.context = ReplContext.getContext();

  return {
    getREPL: () => nodeRepl,
    setREPL: () => ReplContext.hookContext((context) => { nodeRepl.context = context; }),
  };
};

export default {
  js: REPL(jsREPL),
  coffee: REPL(coffeeREPL),
  ts: REPL(tsREPL),
  ls: REPL(lsREPL)
};

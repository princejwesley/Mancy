import path from 'path';
import {EOL} from 'os';
import nodeREPL from 'repl';
import _ from 'lodash';
import child_process from 'child_process';
import vm from 'vm';
import fs from 'fs';
import ReplContext from '../common/ReplContext';

const {cljs, goog, compiler} = require('./clojurescript/clojurescript');
let nodeLineListener = () => {};
let promptData = '';
let contextInitialized = false;
let errMsg = null;

// run once ?
const preludeCode = `
;; (enable-console-print!)
`

let loadFile = (module, filename) => {
  let result = compiler.transpile(fs.readFileSync(fileName));
  return module._compile(result.toString(), filename);
};

// register extensions
let register = () => {
  if (require.extensions) {
    require.extensions['.cljs'] = loadFile;
  }
};

let error = (...args) => {
  let msg = args.join('\n');
  if(errMsg) {
    errMsg += msg;
  } else {
    errMsg = msg;
  }
}

// set compiler warning options
const warnings = () => {
  let options = global.Mancy.preferences.clojurescript;
  let entries = cljs.analyzer._STAR_cljs_warnings_STAR_.root.arr;
  entries.forEach(e => {
    if(e && e.arr && e.arr.length) {
      e.arr.forEach((ev, idx) => {
        if(idx % 2 === 0 && e.arr[idx].name in options) {
          e.arr[idx + 1] = options[e.arr[idx].name];
        }
      });
    }
  });
}

const prelude = () => {
  if(!contextInitialized) {
    cljs.user = {};
    let context = ReplContext.getContext();
    context.global.goog = goog;
    context.global.cljs = cljs;
    cljs.core._STAR_print_fn_STAR_ = context.console.log;
    cljs.core._STAR_print_err_fn_STAR_ = error;
    contextInitialized = true;
  }
  errMsg = null;
};

let evaluate = (input, context, filename, cb) => {
  prelude();
  try {
    let js = compiler.transpile(input);
    return errMsg ? cb(errMsg) : cb(null, vm.runInContext(js, context, filename));
  } catch(e) {
    return cb(e);
  }
}

let transpile = (input, context, cb) => {
  prelude();
  try {
    let js = compiler.transpile(input);
    return errMsg ? cb(errMsg) : cb(null, js);
  } catch(e) {
    return cb(e);
  }
};

let addMultilineHandler = ({rli}) => {
  nodeLineListener = rli.listeners('line')[0];
  rli.removeListener('line', nodeLineListener);
  rli.on('line', (cmd) => {
    promptData += cmd + EOL;
  });
};

let loadAction = {
  help: '?',
  action: function(file) {
    try {
      let stats = fs.statSync(file);
      if (stats && stats.isFile()) {
        let self = this;
        let data = fs.readFileSync(file, 'utf8');
        this.displayPrompt();
        nodeLineListener(data);
        promptData = '';
      } else {
        this.outputStream.write('Failed to load:' + file + ' is not a file\n');
      }
    } catch (e) {
      this.outputStream.write('Failed to load:' + file + '\n');
    }
    this.displayPrompt();
  }
};

/// export repl
export default {
  start: (options = {}) => {
    register();
    let opts = _.extend({eval: evaluate}, options);
    let repl = nodeREPL.start(opts);
    repl.on('exit', () => {
      if(!repl.rli.closed) {
        repl.outputStream.write(EOL);
      }
    });
    repl.input.on('data', (d) => {
      if(d === EOL) {
        nodeLineListener(promptData);
        promptData = '';
      }
    });
    addMultilineHandler(repl);
    repl.transpile = transpile;
    repl.updateCompilerOptions = warnings;
    repl.defineCommand('load', loadAction);
    return repl;
  }
};

import path from 'path';
import {EOL} from 'os';
import nodeREPL from 'repl';
import _ from 'lodash';
import child_process from 'child_process';
import vm from 'vm';
import fs from 'fs';
import ReplContext from '../common/ReplContext';
import ReplOutput from '../common/ReplOutput';

const {cljs, goog, compiler} = require('../node_modules/cljs-mancy/mancy/clojurescript');
let nodeLineListener = () => {};
let promptData = '';
let contextInitialized = false;
let errMsg = null;

const srcPaths = [path.join(__dirname, '..', 'node_modules', 'cljs-mancy', 'mancy')];
// const preludeCode = `
// `

class ClJSHistory {
  constructor() {
    this.ignore = false;
  }
  setError(e) {
    if(!this.ignore) {
      cljs.core._STAR_e = e;
    }
    this.ignore = false;
  }
  setIgnore() { this.ignore = true; }
  setResult(result) {
    if(!this.ignore) {
      cljs.core._STAR_3 = cljs.core._STAR_2;
      cljs.core._STAR_2 = cljs.core._STAR_1;
      cljs.core._STAR_1 = result;
    }
    this.ignore = false;
  }
}

const HISTORY_PATTERN = /^\s*\*[1-3e]\s*$/;
const history = new ClJSHistory();

let loadFile = (module, filename) => {
  let result = "", err;
  compiler.compile(fs.readFileSync(fileName), (e, code) => {
    err = e && e.cause ? e.cause : e;
    result = code && code.value ? code.value : code;
  });
  if(err) { throw err; }
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

let setLookupPath = (paths) => {
  compiler.set_paths(compiler.js2clj(srcPaths.concat(paths)));
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

const updateNS = (ns) => {
  let nps = ns.split('.');
  let context = ReplContext.getContext();
  _.reduce(nps, (cxt, np) => {
    if(!(np in cxt && typeof cxt[np] === "object")) {
      cxt[np] = {};
    }
    return cxt[np];
  }, context);
};

const prelude = () => {
  if(!contextInitialized) {
    let context = ReplContext.getContext();
    context.global.goog = goog;
    context.global.goog.global = context;
    context.global.cljs = cljs;
    let ns = cljs.core.munge(compiler.clj2js(compiler.current_ns()));
    updateNS(ns);
    // much like ;;  (enable-console-print!)
    cljs.core[cljs.core.munge("*print-newline*")] = false;
    cljs.core[cljs.core.munge("*print-fn*")] = context.console.log;
    cljs.core[cljs.core.munge("*print-err-fn*")] = error;

    setLookupPath(ReplContext.getContext().module.paths);
    contextInitialized = true;
    // call after *contextInitialized* set to true
    // evaluate(preludeCode, context, 'mancy-cljs.repl', () => {});
  }
  errMsg = null;
};

const postConditions = () => {
  // Avoid user overrides what mancy overridden
  let context = ReplContext.getContext();
  cljs.core[cljs.core.munge("*print-newline*")] = false;
  cljs.core[cljs.core.munge("*print-fn*")] = context.console.log;
  cljs.core[cljs.core.munge("*print-err-fn*")] = error;

  let ns = cljs.core.munge(compiler.clj2js(compiler.current_ns()));
  updateNS(ns);
}

let evaluate = (input, context, filename, cb) => {
  prelude();
  try {
    let js, err;
    compiler.compile(input, (e, code) => {
      err = e && e.cause ? e.cause : e;
      js = (code && "value" in code ? code.value : code) || "";
    });

    err = errMsg || err;
    postConditions();
    return err
      ? cb(err)
      : cb(null, compiler.clj2js(vm.runInContext(js, context, filename)));
  } catch(e) {
    return cb(e);
  }
}

let transformer = (err, output) => {
  if(err) {
    history.setError(err);
    return null;
  }
  history.setResult(output);
  return ReplOutput.isInstanceOfClojure(output)
    ? output
    : ReplOutput.clojure(output);
};

let transpile = (input, context, cb) => {
  prelude();
  try {
    if(input.match(HISTORY_PATTERN)) {
      history.setIgnore();
    }
    let js, err;
    compiler.compile(input, (e, code) => {
      err = e && e.cause ? e.cause : e;
      const hint = code && code.special;
      js = hint
        ? ReplOutput.clojure(code.value, code.special)
        : code && "value" in code ? code.value : code
    });

    err = errMsg || err;
    postConditions(err, js);
    return errMsg ? cb(errMsg) : cb(err, js, transformer);
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
    repl.setLookupPath = setLookupPath;
    repl.defineCommand('load', loadAction);
    return repl;
  }
};

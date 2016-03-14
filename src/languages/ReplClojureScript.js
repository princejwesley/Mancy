import path from 'path';
import {EOL} from 'os';
import nodeREPL from 'repl';
import _ from 'lodash';
import child_process from 'child_process';
import vm from 'vm';
import fs from 'fs';
import ReplCommon from '../common/ReplCommon';

const {cljs, goog, compiler} = require('./clojurescript/clojurescript');
let nodeLineListener = () => {};
let promptData = '';
let contextInitialized = false;

const preludeCode = `

`
let code = preludeCode;
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

const prelude = () => {
  if(!contextInitialized) {
    cljs.user = {};
    ReplCommon.bindToReplContextGlobal('goog', goog);
    ReplCommon.bindToReplContextGlobal('cljs', cljs);
    contextInitialized = true;
  }
};

let evaluate = (input, context, filename, cb) => {
  prelude();
  let previous = code;
  try {
    code += input;
    let js = compiler.transpile(code);
    return cb(null, vm.runInContext(js, context, filename));
  } catch(e) {
    code = previous;
    return cb(e);
  }
}

let transpile = (input, context, cb) => {
  prelude();
  let previous = code;
  try {
    code += input;
    return cb(null, compiler.transpile(code));
  } catch(e) {
    code = previous;
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
    repl.defineCommand('load', loadAction);
    return repl;
  }
};

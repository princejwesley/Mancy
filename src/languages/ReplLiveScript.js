import ls from 'livescript';
import path from 'path';
import {EOL} from 'os';
import nodeREPL from 'repl';
import _ from 'lodash';
import child_process from 'child_process';
import vm from 'vm';
import fs from 'fs';

let nodeLineListener = () => {};
let promptData = '';

let loadFile = (module, filename) => {
  let result = ls.compile(fs.readFileSync(fileName).toString(), { bare: false });
  return module._compile(result.toString(), filename);
};

// register extensions
let register = () => {
  if (require.extensions) {
    require.extensions['.ls'] = loadFile;
  }

  let fork = child_process.fork;
  let binary = require.resolve(path.join(__dirname, '../node_modules/livescript/bin/lsc'));
  child_process.fork = (path, args, options) => {
    if(/\.tsx?$/.test(path)) {
      if(!Array.isArray(args)) {
        options = args || {};
        args = [];
      }
      args = [path].concat(args);
      path = binary;
    }
    return fork(path, args, options);
  };
};

let evaluate = (input, context, filename, cb) => {
  try {
    let js = ls.compile(input, { bare: true }).toString();
    return cb(null, vm.runInContext(js, context, filename));
  } catch(e) {
    return cb(e);
  }
}

let transpile = (input, context, cb) => {
  try {
    let js = ls.compile(input, { bare: true }).toString();
    let lines = js.split(/\r?\n/g);
    lines.shift();
    return cb(null, lines.join(EOL));
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
    repl.defineCommand('load', loadAction);
    return repl;
  }
};

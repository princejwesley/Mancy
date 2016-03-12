import ts from 'typescript';
import path from 'path';
import {EOL} from 'os';
import nodeREPL from 'repl';
import _ from 'lodash';
import child_process from 'child_process';
import vm from 'vm';
import fs from 'fs';

//reference: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
// and CoffeeScript

const compileOptions = {
  noEmitOnError: true,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  experimentalDecorators: true,
  emitDecoratorMetadata: true, // ?
  newLine: process.platform === 'win32' ? ts.NewLineKind.CarriageReturnLineFeed : ts.NewLineKind.LineFeed,
  target: ts.ScriptTarget.ES5,
};

let code = `/// <reference path="${path.resolve(__dirname, './typescript/node.d.ts')}" />
`;
const replFile = `Mancy.typescript.repl.ts`;
let buildNumber = 0;
let nodeLineListener = () => {};
let promptData = '';

let readTs = fileName => !fs.existsSync(fileName) ? undefined :
  ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
let langServiceHost = {
  getScriptFileNames: () => [replFile],
  getScriptVersion: (fileName) => fileName === replFile && buildNumber.toString(),
  getScriptSnapshot: (fileName) => fileName === replFile ? ts.ScriptSnapshot.fromString(code) : readTs(fileName),
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => compileOptions,
  getDefaultLibFileName: (options) => path.join(__dirname, '../node_modules/typescript/lib/lib.core.es7.d.ts'),
}

let service = ts.createLanguageService(langServiceHost, ts.createDocumentRegistry())

let getDiagnostics = () => {
  let emit = service.getEmitOutput(replFile);
  let allDiagnostics = service.getCompilerOptionsDiagnostics()
    .concat(service.getSyntacticDiagnostics(replFile))
    .concat(service.getSemanticDiagnostics(replFile));
  return allDiagnostics;
};

let loadFile = (module, filename) => {
  let result = ts.transpileModule(fs.readFileSync(filename).toString(), {compilerOptions: compileOptions});
  return module._compile(JSON.stringify(result), filename);
};

// register extensions
let register = () => {
  if (require.extensions) {
    require.extensions['.ts'] = loadFile;
    require.extensions['.tsx'] = loadFile;
  }

  let fork = child_process.fork;
  let binary = require.resolve(path.join(__dirname, '../node_modules/typescript/bin/tsc'));
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

let transpile = (input, context, cb) => {
  let original = code;
  code += `\n${input}`;
  buildNumber += 1;
  let allDiagnostics = getDiagnostics();

  if(global.Mancy.session.editor !== 'REPL') {
    code = original;
  }

  if(allDiagnostics.length) {
    code = original;
    let diagnostic = allDiagnostics[0];
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, EOL);
    if(!diagnostic.file) { return cb(message); }
    let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    let lineOffset = global.Mancy.session.editor === 'REPL' ? original.split(/\n/).length : 0;
    return cb(`${diagnostic.file.fileName} (${line + 1 - lineOffset},${character + 1}): ${message}`);
  }

  let result = ts.transpile(input);
  if(result !== input) {
    result = result.replace(/(["'])use\sstrict\1;?/, '"use strict";\nvoid 0;\n');
  }

  return cb(null, result);
};

let evaluate = (input, context, filename, cb) => {
  transpile(input, context, (err, js) => {
    if(err) { return cb(err); };
    cb(null, vm.runInContext(js, context, filename));
  });
}

let addMultilineHandler = ({rli}) => {
  nodeLineListener = rli.listeners('line')[0];
  rli.removeListener('line', nodeLineListener);
  rli.on('line', (cmd) => {
    promptData += cmd + EOL;
  });
};

let completion = (repl) => {
  repl.complete = (input, cb) => {
    let original = code;
    try {
      code += input;
      let suggestions = service.getCompletionsAtPosition(replFile, code.length);
      code = original;

      if(!suggestions) { cb(null, [[],""]); }
      else {
        let lines = input.split(/\r?\n/);
        let lastLine = lines[lines.length - 1];
        let prefix = lastLine.match(/[$\w]+$/);
        let results;
        if(prefix) {
          let p = prefix[0];
          results = _.chain(suggestions.entries)
            .filter((e) => e.name.substring(0, p.length) === p)
            .map((e) => [e.name, e.kind])
            .value();
        } else {
          results = suggestions.entries.map((e) => [e.name, e.kind]);
        }
        let [names, kinds] = _.reduce(results, (o, [name, kind]) => {
          o[0].push(name);
          o[1].push(kind);
          return o;
        }, [[], []]);
        cb(null, [names, prefix ? prefix[0] : ""], kinds);
      }
    } catch(e) {
      code = original;
      cb(null, [[],""]);
    }
  };
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
    completion(repl);
    repl.transpile = transpile;
    repl.defineCommand('load', loadAction);
    return repl;
  }
};

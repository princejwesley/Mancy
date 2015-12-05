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
const replFile = `Mancy.typescript.repl.${Date.now()}.ts`;
let buildNumber = 0;
let nodeLineListener = () => {};
let promptData = '';

let langServiceHost = {
  getScriptFileNames: () => [replFile],
  getScriptVersion: (fileName) => fileName === replFile && buildNumber.toString(),
  getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(fileName === replFile ? code : fs.readFileSync(fileName).toString()),
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => compileOptions,
  getDefaultLibFileName: (options) => path.join(__dirname, '../node_modules/typescript/lib/lib.core.es6.d.ts'),
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
  let result = ts.transpile(fs.readFileSync(filename).toString(), compileOptions);
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
  code += input;
  buildNumber += 1;
  let allDiagnostics = getDiagnostics();
  code = original;

  if(allDiagnostics.length) {
    let diagnostic = allDiagnostics[0];
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, EOL);
    if(!diagnostic.file) { return cb(message); }
    let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return cb(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  }

  return cb(null, ts.transpile(input));
};

let evaluate = (input, context, filename, cb) => {
  let original = code;
  code += input;
  buildNumber += 1;
  let allDiagnostics = getDiagnostics();

  if(allDiagnostics.length) {
    let diagnostic = allDiagnostics[0];
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, EOL);
    if(!diagnostic.file) { return cb(message); }
    let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    code = original;
    return cb(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  }
  let js = ts.transpile(input);
  return cb(null, vm.runInContext(js, context, filename));
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
    return repl;
  }
};

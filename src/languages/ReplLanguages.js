import {js, coffee, ts, ls, cljs} from './ReplLangWrapper';

// node repl wrappers
const langs = {
  js,
  coffee,
  ts,
  ls,
  cljs,
};

let repl = langs.js;
repl.setREPL();

const getREPL = () => {
  return repl.getREPL();
}

// being used for repl mode
const getREPLProvider = () => {
  return langs.js.repl;
}

const setREPL = (name) => {
  if(!langs[name]) {
    throw new Error(`Unsupported lang ${name}`);
  }
  repl = langs[name];
  repl.setREPL();

  const langREPL = repl.getREPL();
  if(langREPL.updateCompilerOptions) {
    langREPL.updateCompilerOptions();
  }

  return langREPL;
}

const getNamespace = () => {
  const langREPL = getREPL();
  if(typeof langREPL.getNamespace === 'function') {
    return langREPL.getNamespace();
  }
  return '';
}

const aliases = {
  js: 'js', json: 'js', node: 'js',
  coffee: 'coffee', litcoffee: 'coffee', 'coffee.md': 'coffee',
  ls: 'ls',
  ts: 'ts', tsx: 'ts',
  cljs: 'cljs',
};

const qualifiedNames = {
  js: 'javascript', json: 'javascript', node: 'javascript',
  coffee: 'x-coffeescript', litcoffee: 'x-coffeescript', 'coffee.md': 'x-coffeescript',
  ls: 'x-liveScript',
  ts: 'typescript', tsx: 'typescript',
  cljs: 'x-clojure'
};


export default {
  getREPL,
  setREPL,
  getREPLProvider,
  getNamespace,
  getLangName: (ext) => aliases[ext],
  getLangQualifiedName: (ext) => qualifiedNames[ext],
  setLookupPath: (paths) => langs.forEach(l => l.setLookupPath && l.setLookupPath(paths))
};

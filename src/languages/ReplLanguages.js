import {js, coffee, ts, ls} from './ReplLangWrapper';

// node repl wrappers
const langs = {
  js,
  coffee,
  ts,
  ls,
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
  return repl.getREPL();
}

const aliases = {
  js: 'js', json: 'js', node: 'js',
  coffee: 'coffee', litcoffee: 'coffee', 'coffee.md': 'coffee',
  ls: 'ls',
  ts: 'ts', tsx: 'ts'
};

const qualifiedNames = {
  js: 'javascript', json: 'javascript', node: 'javascript',
  coffee: 'x-coffeescript', litcoffee: 'x-coffeescript', 'coffee.md': 'x-coffeescript',
  ls: 'x-liveScript',
  ts: 'typescript', tsx: 'typescript'
};


export default {
  getREPL,
  setREPL,
  getREPLProvider,
  getLangName: (ext) => aliases[ext],
  getLangQualifiedName: (ext) => qualifiedNames[ext]
};

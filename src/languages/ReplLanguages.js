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

export default {
  getREPL,
  setREPL,
  getLangName: (ext) => aliases[ext]
};

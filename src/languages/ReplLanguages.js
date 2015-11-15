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

export default {
  getREPL,
  setREPL,
};

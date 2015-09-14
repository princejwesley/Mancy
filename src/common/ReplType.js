// auto suggestion types
const BOOLEAN = Symbol('boolean');
const NUMBER = Symbol('number');
const KEYWORD = Symbol('keyword');
const OBJECT = Symbol('object');
const SYMBOL = Symbol('symbol');
const UNDEFINED = Symbol('undefined');
const STRING = Symbol('string');
const FUNCTION = Symbol('function');

let typeEval = (x) => {
  try { return eval(x); }
  catch(e) {}
  return getTypeName(KEYWORD);
};

const typeNames = {
  [BOOLEAN]: 'boolean',
  [NUMBER]: 'number',
  [STRING]: 'string',
  [OBJECT]: 'object',
  [SYMBOL]: 'symbol',
  [FUNCTION]: 'function',
  [KEYWORD]: 'keyword',
  [UNDEFINED]: 'undefined'
};

const typeOf = (x) => {
  var type = typeEval(x);
  var typeIdentifier = typeof type;
  var symbol = Symbol(typeIdentifier);
  return typeNames[symbol] ? symbol : OBJECT;
};

const getTypeName = (symbol) => typeNames[symbol];

export default {
  typeOf: typeOf,
  getTypeName: getTypeName
};

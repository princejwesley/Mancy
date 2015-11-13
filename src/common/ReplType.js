// auto suggestion types
const BOOLEAN = Symbol.for('boolean');
const NUMBER = Symbol.for('number');
const KEYWORD = Symbol.for('keyword');
const OBJECT = Symbol.for('object');
const SYMBOL = Symbol.for('symbol');
const UNDEFINED = Symbol.for('undefined');
const STRING = Symbol.for('string');
const FUNCTION = Symbol.for('function');

//ts
const VAR = Symbol.for('var');
const LET = Symbol.for('let');
const MODULE = Symbol.for('module');
const INTERFACE = Symbol.for('interface');

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
  [UNDEFINED]: 'undefined',
  [INTERFACE]: 'interface',
  [MODULE]: 'module',
  [LET]: 'let',
  [VAR]: 'var',
};

const typeNamesShort = {
  [BOOLEAN]: 'b',
  [NUMBER]: 'n',
  [STRING]: 's',
  [OBJECT]: 'o',
  [SYMBOL]: 'y',
  [FUNCTION]: 'f',
  [KEYWORD]: 'k',
  [UNDEFINED]: 'u',
  [INTERFACE]: 'i',
  [MODULE]: 'm',
  [LET]: 'l',
  [VAR]: 'v',
};

let typeOfNonJS = (x) => {
  var symbol = Symbol.for(x);
  return typeNames[symbol] ? symbol : OBJECT;
}

const es2015Keywords = [
  "arguments",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
];

const es5Keywords = [
  "arguments",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
];

const isES2015Keyword = (x) => es2015Keywords.indexOf(x) !== -1;
const isES5Keyword = (x) => es5Keywords.indexOf(x) !== -1;

const typeOf = (x) => {
  if(global.Mancy.preferences.lang !== 'js') {
    return typeOfNonJS(x);
  }
  if(isES2015Keyword(x)) { return KEYWORD; }
  var type = typeEval(x);
  var typeIdentifier = typeof type;
  var symbol = Symbol.for(typeIdentifier);
  return typeNames[symbol] ? symbol : OBJECT;
};

const getTypeName = (symbol) => typeNames[symbol];
const getTypeNameShort = (symbol) => typeNamesShort[symbol];

export default {
  typeOf: typeOf,
  getTypeName: getTypeName,
  getTypeNameShort: getTypeNameShort
};

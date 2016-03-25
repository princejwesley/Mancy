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
const CLASS = Symbol.for('class');
const ALIAS = Symbol.for('alias');
const CONST = Symbol.for('const');
const CALL = Symbol.for('call');
const CONSTRUCT = Symbol.for('construct');
const TYPE = Symbol.for('type');
const METHOD = Symbol.for('method');
const LABEL = Symbol.for('label');
const ENUM = Symbol.for('enum');
const CONSTRUCTOR = Symbol.for('constructor');
const WARNING = Symbol.for('warning');
const INDEX = Symbol.for('index');
const PARAMETER = Symbol.for('parameter');
const PROPERTY = Symbol.for('property');
const SCRIPT = Symbol.for('script');
const LOCAL_CLASS_ELEMENT = Symbol.for('local class');
const LOCAL_FUNCTION_ELEMENT = Symbol.for('local function');
const LOCAL_VARIABLE_ELEMENT = Symbol.for('local var');
const MEMBER_GET_ACCESSOR_ELEMENT = Symbol.for('getter');
const MEMBER_SET_ACCESSOR_ELEMENT = Symbol.for('setter');
const PREIMITIVE_TYPE = Symbol.for('primitive type');
const TYPE_PARAMETER_ELEMENT = Symbol.for('type parameter');

//cljs
const NAMESPACE = Symbol.for('namespace');
const NIL = Symbol.for('nil');
const VECTOR = Symbol.for('vector');
const LIST = Symbol.for('list');
const SET = Symbol.for('set');
const MAP = Symbol.for('map');
const ARRAY = Symbol.for('array');
const VOLATILE = Symbol.for('volatile');
const SEQ = Symbol.for('seq');
const ATOM = Symbol.for('atom');
const UUID = Symbol.for('uuid');

const HISTORY = Symbol.for('history');

let typeEval = (x) => {
  try { return /\w\./.test(x) ? PROPERTY : eval(x); }
  catch(e) {}
  return OBJECT;
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
  [CLASS]: 'class',
  [ALIAS]: 'alias',
  [CONST]: 'const',
  [CALL]: 'call',
  [CONSTRUCT]: 'construct',
  [TYPE]: 'type',
  [METHOD]: 'method',
  [LABEL]: 'label',
  [ENUM]: 'enum',
  [CONSTRUCTOR]: 'constructor',
  [WARNING]: 'warning',
  [INDEX]: 'index',
  [PARAMETER]: 'parameter',
  [PROPERTY]: 'property',
  [SCRIPT]: 'script',
  [LOCAL_CLASS_ELEMENT]: 'local class',
  [LOCAL_FUNCTION_ELEMENT]: 'local function',
  [LOCAL_VARIABLE_ELEMENT]: 'local var',
  [MEMBER_GET_ACCESSOR_ELEMENT]: 'getter',
  [MEMBER_SET_ACCESSOR_ELEMENT]: 'setter',
  [PREIMITIVE_TYPE]: 'primitive type',
  [TYPE_PARAMETER_ELEMENT]: 'type parameter',
  [NAMESPACE]: 'namespace',
  [NIL]: 'nil',
  [VECTOR]: 'vector',
  [LIST]: 'list',
  [SET]: 'set',
  [MAP]: 'map',
  [ARRAY]: 'array',
  [VOLATILE]: 'volatile',
  [SEQ]: 'seq',
  [ATOM]: 'atom',
  [UUID]: 'uuid',
  [HISTORY]: 'history',
};

// short names are repeated - tooltip helps
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
  [CLASS]: 'c',
  [ALIAS]: 'a',
  [CONST]: 'C',
  [CALL]: 'c',
  [CONSTRUCT]: 'c',
  [TYPE]: 't',
  [METHOD]: 'm',
  [LABEL]: 'L',
  [ENUM]: 'e',
  [CONSTRUCTOR]: 'c',
  [WARNING]: 'w',
  [INDEX]: 'x',
  [PARAMETER]: 'p',
  [PROPERTY]: 'P',
  [SCRIPT]: 'S',
  [LOCAL_CLASS_ELEMENT]: 'c',
  [LOCAL_FUNCTION_ELEMENT]: 'f',
  [LOCAL_VARIABLE_ELEMENT]: 'v',
  [MEMBER_GET_ACCESSOR_ELEMENT]: 'g',
  [MEMBER_SET_ACCESSOR_ELEMENT]: 's',
  [PREIMITIVE_TYPE]: 't',
  [TYPE_PARAMETER_ELEMENT]: 't',
  [NAMESPACE]: 'N',
  [NIL]: 'u',
  [VECTOR]: 'v',
  [LIST]: 'l',
  [SET]: 's',
  [MAP]: 'm',
  [ARRAY]: 'a',
  [VOLATILE]: 'v',
  [SEQ]: 's',
  [ATOM]: 'a',
  [UUID]: '#',
  [HISTORY]: 'h',
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

const isES2015Keyword = (x) => es2015Keywords.indexOf(x) !== -1;
const typeOf = (x) => {
  if(global.Mancy.preferences.lang !== 'js') {
    return typeOfNonJS(x);
  }
  if(isES2015Keyword(x)) { return KEYWORD; }
  var symbol = Symbol.for(x);
  if(typeNames[symbol]) {
    return symbol;
  }
  var type = typeEval(x);
  if(typeNames[type]) { return type;}
  symbol = Symbol.for(typeof type);

  return typeNames[symbol] ? symbol : OBJECT;
};

const getTypeName = (symbol) => typeNames[symbol];
const getTypeNameShort = (symbol) => typeNamesShort[symbol];

export default {
  typeOf: typeOf,
  getTypeName: getTypeName,
  getTypeNameShort: getTypeNameShort
};

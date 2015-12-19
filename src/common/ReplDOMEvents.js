import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';

const navigation = {
  'keyLeft': 37,
  'keyup': 38,
  'keyRight': 39,
  'keydown': 40,
};

const events = {
  'blurEvent': 'blur',
  'keydownEvent': 'keydown',
  'keyupEvent': 'keyup',
};

const keyNameBindings = {
  'tab': 9,
  'enter': 13,
  'escape': 27,
  'space': 32,
  'quote': 222,
  'backTick': 192,
  'backSpace': 8,
};

let combined = _.extend({}, keyNameBindings, navigation);

let reducer = (input, attr) => {
  return _.chain(input)
    .keys()
    .map((key) => [key, (e) => e[attr] === input[key]])
    .reduce((result, [key, fun]) => {
      result['is' + _.capitalize(key)] = fun;
      return result;
    }, {})
    .value();
};


let ReplDOMEvents = _.extend({}, reducer(combined, 'which'), reducer(events, 'type'));

ReplDOMEvents.isNavigation = (() => {
  let values = _.values(navigation);
  return (e) => values.indexOf(e.which) !== -1;
})();

ReplDOMEvents.autoFillPairCharacters = {
  '"' : '"',
  "'" : "'",
  '`' : '`',
  '{' : '}',
  '[' : ']',
  '(' : ')',
  '}' : '{',
  ']' : '[',
  ')' : '('
};

ReplDOMEvents.autoCloseKeyIdentifiers = {
  '"' : "U+0022",
  "'" : "U+0027",
  "[" : "U+005B",
  "]" : "U+005D",
  "{" : "U+007B",
  "}" : "U+007D",
  "(" : "U+0028",
  ")" : "U+0029",
  "`" : "U+0060",
};

ReplDOMEvents.duplicate = (e) => new e.constructor(e.type, e);

// keyCodes for alphabets A-Z
const A = 'A'.charCodeAt(0);
_.each('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (c, pos) => {
  ReplDOMEvents[c] = A + pos;
});

ReplDOMEvents.zero = '0'.charCodeAt(0); //48
ReplDOMEvents.nine = ReplDOMEvents.zero + 9; //'9'.charCodeAt(0);
ReplDOMEvents.isNumber = (e) => e.which >= ReplDOMEvents.zero && e.which <= ReplDOMEvents.nine;

export default ReplDOMEvents;

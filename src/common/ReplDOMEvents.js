import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';

let navigation = {
  'keyLeft': 37,
  'keyup': 38,
  'keyRight': 39,
  'keydown': 40,
};

let events = {
  'blurEvent': 'blur',
  'keydownEvent': 'keydown',
  'keyupEvent': 'keyup',
};

let keyNameBindings = {
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

let autoFillCharacters = [
  192, //backtick
  219, //{ or [
  222, //single/double quotes
];
ReplDOMEvents.hasAutoFillCharacters = (e) => {
  // SHIFT + 57 -> '('
  return autoFillCharacters.indexOf(e.keyCode) !== -1 || (e.shiftKey && e.keyCode === 57);
};

ReplDOMEvents.autoFillPairCharacters = {
  '"' : '"',
  "'" : "'",
  '`' : '`',
  '{' : '}',
  '[' : ']',
  '(' : ')'
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
let A = 'A'.charCodeAt(0);
_.each('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (c, pos) => {
  ReplDOMEvents[c] = A + pos;
});

export default ReplDOMEvents;

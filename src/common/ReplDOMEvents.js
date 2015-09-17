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

export default ReplDOMEvents;

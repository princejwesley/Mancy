import React from 'react';
import ReplSuggestions from './components/ReplSuggestions';
import Repl from './components/Repl';
import _ from 'lodash';


(() => {
  // Temporary fix for node bug : https://github.com/nodejs/node/issues/3158
  let ownPropertyNames = Object.getOwnPropertyNames.bind(Object);

  Object.getOwnPropertyNames = (o) => {
    let result = ownPropertyNames(o);
    let keys = Object.keys(o);
    let difference = _.difference(keys, result);
    return difference.length ? result.concat(difference) : result;
  };
})();

// react entry point
(() => {
  const repl = document.getElementById('node-repl-plus');
  React.render(<Repl />, repl);
  const suggestion = document.getElementById('node-repl-prompt-suggestions');
  React.render(<ReplSuggestions />, suggestion);
})();

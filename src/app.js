import React from 'react';
import ReplSuggestions from './components/ReplSuggestions';
import Repl from './components/Repl';

// react entry point
(function() {
  const repl = document.getElementById('node-repl-plus');
  React.render(<Repl />, repl);
  const suggestion = document.getElementById('node-repl-prompt-suggestions');
  React.render(<ReplSuggestions />, suggestion);
})();

import React from 'react';
import Repl from './build/components/Repl';
import ReplSuggestions from './build/components/ReplSuggestions';

// react entry point
(function() {
  const repl = document.getElementById('node-repl-plus');
  React.render(<Repl />, repl);
  const suggestion = document.getElementById('node-repl-prompt-suggestions');
  React.render(<ReplSuggestions />, suggestion);
})();

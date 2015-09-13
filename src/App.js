import React from 'react';
import Repl from './build/components/Repl';

// react entry point
(function() {
  const repl = document.getElementById('node-repl-plus');
  React.render(<Repl token={Date.now()}/>, repl);
})();

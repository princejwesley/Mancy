import '../../stylesheets/repl.scss';

import React from 'react';
import Repl from './Repl.jsx';

// react entry point
(function() {
  const repl = document.getElementById('node-repl-plus');
  React.render(<Repl />, repl);
})();

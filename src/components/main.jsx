import '../../stylesheets/repl.scss';

import React from 'react';
import Repl from './Repl.jsx';
import uuid from 'node-uuid';

// react entry point
(function() {
  const repl = document.getElementById('node-repl-plus');
  React.render(<Repl id={uuid.v4()}/>, repl);
})();

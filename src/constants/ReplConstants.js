const ReplConstants = {
  REPL_HISTORY_SIZE: 1000,
  REPL_ENCODING: 'utf8',
  TAB_WIDTH: 2,
  COMMAND_TRUNCATE_LENGTH: 80,
  OUTPUT_TRUNCATE_LENGTH: 80,
  PROMISE: {
    PENDING: 'pending',
    RESOLVED: 'fulfilled',
    REJECTED: 'rejected',
  },
  BABEL_OPTIONS: {
    "presets": ["es2015", "react", "stage-0"],
    "plugins": ["transform-runtime"],
    "highlightCode": false,
    "filename": "repl",
    "env": process.env,
    "retainLines": true,
    "ast": false,
    "babelrc": false,
  },
  EXEC_TIMEOUT: 60000,
  IFRAME_MAX_HEIGHT: 500,
  REPL_WATERMARK_LOGO: '>_',
  REPL_WATERMARK_MSG: 'REPL for fun 🙈',
};

export default ReplConstants;

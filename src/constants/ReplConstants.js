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
    filename: 'repl',
    highlightCode: false,
    ast: false,
    stage: 0,
    retainLines: true,
    blacklist: ["strict"],
    env: process.env,
    optional:[
      'runtime',
      'es7.asyncFunctions',
      'es7.classProperties',
      'es7.comprehensions',
      'es7.decorators',
      'es7.doExpressions',
      'es7.exponentiationOperator',
      'es7.exportExtensions',
      'es7.functionBind',
      'es7.objectRestSpread',
      'es7.trailingFunctionCommas',
      ]
  },
  EXEC_TIMEOUT: 15000,
  IFRAME_MAX_HEIGHT: 500,
};

export default ReplConstants;

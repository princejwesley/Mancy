import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import ReplOutput from '../common/ReplOutput';
let babel = require('babel-core');

const awaitMatcher = /^(?:\s*(?:(?:let|var|const)\s)?\s*([^=]+)=\s*|^\s*)(await\s.*)/;
const sourceMatcher = /^\s*(\.source)\s+([^\s]+)\s*$/;
const USE_STRICT_LENGTH = "'user strict;'".length;

let asyncWrapper = (code, binder) => {
  let assign = binder ? `root.${binder} = result;` : '';
  return `(async function() { let result = (${code}); ${assign} return result; }())`;
};

let cook = (plain) => {
  let tplain = plain.trim();
  let source = tplain.match(sourceMatcher);
  if(source) {
    let mod = source[2];
    return {
      local: true,
      output: ReplOutput.source(mod),
      input: `<span class='source'>.source <span class='module'>${mod}</span></span>`
    }
  }

  let output = plain, force = false;

  if(global.Mancy.preferences.asyncWrap && global.Mancy.preferences.lang === 'js') {
    // bare await
    let match = plain.match(awaitMatcher);
    if(match) {
      output = `${asyncWrapper(match[2], match[1])}`;
      force = true;
    }
  }

  return {
    force,
    local: false,
    output: global.Mancy.preferences.babel && global.Mancy.preferences.lang === 'js' ? babelTransfrom(output) : output
  };
};

let babelTransfrom = (plain) => {
  try {
    return babel
      .transform(plain, ReplConstants.BABEL_OPTIONS)
      .code;
  } catch(e) {
    return e;
  }
}

let ReplInput = {
  transform: (plain) => {
    return cook(plain);
  }
};

export default ReplInput;

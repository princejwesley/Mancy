import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import ReplOutput from '../common/ReplOutput';
let babel = require('babel-core');

const awaitMatcher = /^(.*\s|^)(await\s.*)/;
const sourceMatcher = /^\s*(\.source)\s+([^\s]+)\s*$/;
let asyncWrapper = (code) => {
  return `(async function() { let result = (${code}); return result; }())`;
};

let cook = (plain, transpile) => {
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

  let output = plain;

  if(!transpile && global.Mancy.preferences.asyncWrap && global.Mancy.preferences.lang === 'js') {
    // bare await
    let match = plain.match(awaitMatcher);
    if(match && match[1].indexOf('async') === -1) {
      output = `${match[1]}${asyncWrapper(plain.substring(match[1].length))}`;
    }
  }

  return {
    local: false,
    output: global.Mancy.preferences.babel && global.Mancy.preferences.lang === 'js' ? babelTransfrom(output, transpile) : output
  };
};

let babelTransfrom = (plain, transpile = false) => {
  try {
    return babel
      .transform(plain, ReplConstants.BABEL_OPTIONS)
      .code;
  } catch(e) {
    return transpile ? e : plain;
  }
}

let ReplInput = {
  transform: (plain, transpile = false) => {
    return cook(plain, transpile);
  }
};

export default ReplInput;

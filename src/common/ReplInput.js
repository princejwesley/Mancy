import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import ReplOutput from '../common/ReplOutput';
let babel = require('babel-core');

const awaitMatcher = /^(.*\s|^)(await\s.*)/;
const sourceMatcher = /^\s*(\.source)\s+([^\s]+)\s*$/;
let asyncWrapper = (code) => {
  return `(async function() { ${code} }())`;
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

  let output = plain;
  // bare await
  let match = plain.match(awaitMatcher);
  if(match && match[1].indexOf('async') === -1) {
    output = `${match[1]}${asyncWrapper(plain.substring(match[1].length))}`;
  }

  return {
    local: false,
    output: global.Mancy.preferences.babel ? babelTransfrom(output) : output
  };
};

let babelTransfrom = (plain) => {
  try {
    return babel
      .transform(plain, ReplConstants.BABEL_OPTIONS)
      .code;
  } catch(e) {
    return plain;
  }
}

let ReplInput = {
  transform: (plain) => {
    return cook(plain);
  }
};

export default ReplInput;

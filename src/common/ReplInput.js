import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
let babel = require('babel-core');

const awaitMatcher = /^(.*\s|^)(await\s.*)/;
let asyncWrapper = (code) => {
  return `(async function() { ${code} }())`;
};

let preprocess = (plain) => {
  // bare await
  let match = plain.match(awaitMatcher);
  if(match && match[1].indexOf('async') === -1) {
    return `${match[1]}${asyncWrapper(plain.substring(match[1].length))}`;
  }
  return plain;
};

let babelTransfrom = (plain) => {
  try {
    plain = preprocess(plain);
    return babel
      .transform(plain, ReplConstants.BABEL_OPTIONS)
      .code;
  } catch(e) {
    return plain;
  }
}

let ReplInput = {
  transform: (plain) => {
    return global.preferences.babel ? babelTransfrom(plain) : plain;
  }
};

export default ReplInput;

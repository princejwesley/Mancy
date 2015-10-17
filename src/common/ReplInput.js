import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
let babel = require('babel-core');

let preprocess = (plain) => {

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

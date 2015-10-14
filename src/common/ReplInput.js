import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
let babel = require('babel-core');


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
    return babelTransfrom(plain);
  }
};

export default ReplInput;

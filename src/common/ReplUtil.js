import _ from 'lodash';
import hl from 'highlight.js';
import ReplConstants from '../constants/ReplConstants';

let ReplUtil = {
  times: (num, str) => {
    return new Array(num + 1).join(str);
  },
  highlight: (code) => {
    return hl.highlight('js', code, true).value;
  },
  isExceptionMessage: (msg) => {
    return /Error:/.test(msg);
  },
  isStackTrace: (trace) => {
    return !!trace && trace.every((t) => {
      return /^\s+at\s/.test(t) || /^$/.test(t);
    });
  }
};

hl.configure({
  tabReplace: ReplUtil.times(ReplConstants.TAB_WIDTH, ' '),
  classPrefix: ''
});

export default ReplUtil;

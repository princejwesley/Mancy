import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import ReplOutput from '../common/ReplOutput';
let babel = require('babel-core');

const awaitMatcher = /^(?:\s*(?:(?:let|var|const)\s)?\s*([^=]+)=\s*|^\s*)(await\s.*)/;
const sourceMatcher = /^\s*(\.source)\s+([^\s]+)\s*$/;
const importMatcher = /^\s*import\s+(?:(?:{(.+?)})|(.+?))\s+from\s+(['"])(.+)\3/m;
const USE_STRICT_LENGTH = "'user strict;'".length;

let asyncWrapper = (code, binder) => {
  let assign = binder ? `root.${binder} = result;` : '';
  return `(async function() { let result = (${code}); ${assign} return result; }())`;
};

let importWrapper = (code, [prefix, bindings, asBinding, __, modname]) => {
  if(asBinding) {
    return code.replace(prefix, `import * as ${asBinding} from '${modname}';`);
  }
  let suffix = Array.join(bindings.replace(/\s+/,'').split(',').map(m => `root.${m} = require('${modname}').${m};\n`), '');
  return code.replace(prefix,`${prefix};\n${suffix}; undefined`);
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

  if(global.Mancy.preferences.lang === 'js') {
    if(global.Mancy.preferences.asyncWrap) {
      // bare await
      let match = plain.match(awaitMatcher);
      if(match) {
        output = `${asyncWrapper(match[2], match[1])}`;
        force = true;
      }
    }
    if(!force) {
      let match = plain.match(importMatcher);
      if(match) {
        output = `${importWrapper(plain, match)}`;
      }
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
    let matchCommonJS = (opt) => opt === 'transform-es2015-modules-commonjs';
    let strict = false;

    if(global.Mancy.session.mode === 'Strict') {
      strict = true;
      if(_.findIndex(ReplConstants.BABEL_OPTIONS.plugins, matchCommonJS) === -1) {
        ReplConstants.BABEL_OPTIONS.plugins.push('transform-es2015-modules-commonjs');
      }
    } else { _.remove(ReplConstants.BABEL_OPTIONS.plugins, matchCommonJS); }

    let code = babel
      .transform(plain, ReplConstants.BABEL_OPTIONS)
      .code;

    return strict ? code.substring(USE_STRICT_LENGTH - 1) : code;
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

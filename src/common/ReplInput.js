import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from './ReplCommon';
import ReplOutput from '../common/ReplOutput';
let babel = require('babel-core');

const functionMatcher = /^\s*\bfunction\s+(..*?)\(/;
const awaitMatcher = /^(?:\s*(?:(?:let|var|const)\s)?\s*([^=]+)=\s*|^\s*)(await\s[\s\S]*)/;
const sourceMatcher = /^\s*(\.source)\s+([^\s]+)\s*$/;
const importMatcher = /\bimport\s+(?:(?:{(.+?)})|(.+?))\s+from\s+(['"])(.+?)\3/g;
const bindAsMatcher = /(.*)\s+as\s+(.*)/;
const asDefaultMatcher = /(?:\*|default)\s+as/;
const USE_STRICT_LENGTH = "'user strict;'".length;


let funTransformer = (source, find, replace) =>
  `var ${replace} = function ${replace}(${source.substring(find.length)}`;
let asyncWrapper = (code, binder) => {
  let assign = binder ? `root.${binder} = result;` : '';
  return `(async function() { let result = (${code}); ${assign} return result; }())`;
};

let importToRequire = (prefix, bindings, asBinding, __, modname) => {
  if(asBinding) {
    return `var ${asBinding.replace(asDefaultMatcher, '')} = (require('${modname}').default || require('${modname}'));`;
  }
  let result = Array.join((bindings).trim()
    .split(',')
    .map(m => {
      const asM = m.trim();
      const asBound = asM.match(bindAsMatcher);
      const [x, y] = asBound ? [asBound[1], asBound[2]] : [asM, asM];
      const attr = x === 'default' || x === '*' ? '' : `.${x}`;
      return `root.${y} = (require('${modname}').default || require('${modname}'))${attr};\n`
    }), '');
  return `${result}; void 0;`;
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

  if(global.Mancy.session.lang === 'js') {
    let funMatch = output.match(functionMatcher);
    if(funMatch) {
      output = `${funTransformer(output, funMatch[0], funMatch[1])}`;
    }
    if(global.Mancy.preferences.asyncWrap) {
      // bare await
      let match = output.match(awaitMatcher);
      if(match) {
        output = `${asyncWrapper(match[2], match[1])}`;
        force = true;
      }
    }
    if(!force && plain.indexOf('import') !== -1) {
      output = plain.replace(importMatcher, importToRequire);
    }
  }

  return {
    force,
    local: false,
    output: global.Mancy.session.babel && global.Mancy.session.lang === 'js' ? babelTransfrom(output) : output
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

    // transform imports added by babel scripts into require
    if(!strict && code.indexOf('import') !== -1) {
      code = code.replace(importMatcher, importToRequire);
    }

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

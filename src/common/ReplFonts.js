import _ from 'lodash';

const weights = {
  100: 'Thin',
  200: 'Ultra Light',
  300: 'Light',
  400: 'Normal',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Ultra Bold',
  900: 'Heavy',
};

const widths = {
  1: 'Ultra Condensed',
  2: 'Extra Condensed',
  3: 'Condensed',
  4: 'Semi Condensed',
  5: 'Normal',
  6: 'Semi Expanded',
  7: 'Expanded',
  8: 'Extra Expanded',
  9: 'Ultra Expanded',
};

const systemFonts = (() => {
  try {
    const settings = require('./../package.json').settings;
    const locals = [
      { family: 'Droid Sans Mono' },
      { family: 'FiraCode' },
      { family: 'Josefin Sans' }
    ];
    return _.chain(settings['disable-font-manager'] ? locals : require('font-manager').getAvailableFontsSync())
      .tap((fonts) => {
        locals.forEach(f => fonts.push(f));
      })
      .sortBy("family")
      .map((f) => f.family)
      .uniq(true)
      .value();
  } catch(e) {
    // disable font preferences
    return [];
  }
})();

const getSystemFonts = () => systemFonts;
const setFontFamily = (family = 'monospace', defaults = 'sans-serif') => document.body.style.fontFamily = `${family}, ${defaults}`;

export default { getSystemFonts, setFontFamily };

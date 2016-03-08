import React from 'react';
import ReplSuggestions from './components/ReplSuggestions';
import ReplPreferences from './components/ReplPreferences';
import Repl from './components/Repl';
import ReplConstants from './constants/ReplConstants';
import ReplFonts from './common/ReplFonts';
import _ from 'lodash';
import remote from 'remote';
import webFrame from 'web-frame';
import {ipcRenderer} from 'electron';

(() => {
  // Temporary fix for node bug : https://github.com/nodejs/node/issues/3158
  let ownPropertyNames = Object.getOwnPropertyNames.bind(Object);

  Object.getOwnPropertyNames = (o) => {
    let result = ownPropertyNames(o);
    let keys = Object.keys(o);
    let difference = _.difference(keys, result);
    return difference.length ? result.concat(difference) : result;
  };
})();

// preferences & user data path
(() => {
  let preferences = JSON.parse(localStorage.getItem('preferences') || '{}');
  let defaults = {
    "editor": "REPL",
    "mode": "Strict",
    "theme": "Dark Theme",
    "timeout": ReplConstants.EXEC_TIMEOUT,
    "babel": false,
    "suggestionDelay": 250,
    "toggleShiftEnter": false,
    "asyncWrap": true,
    "autoCompleteOnEnter": false,
    "toggleAutomaticAutoComplete": false,
    "lang": "js",
    "fontFamily": "Droid Sans Mono",
    "pageZoomFactor": 1,
    "watermark": true,
    "transpile": false,
    "loadScript": null,
    "promptOnClose": true,
    "toggleFoldGutter": true,
    "toggleLineNumberGutter": true,
    "keyMap": "sublime",
    "npmPaths": [],
    "historySize": 1000,
    "historyAggressive": false
  };

  _.each(_.keys(defaults), (key) => {
    if(!(key in preferences)) {
      preferences[key] = defaults[key];
    }
  });
  global.Mancy = { preferences: preferences };
  localStorage.setItem('preferences', JSON.stringify(preferences));

  global.Mancy.userData = remote.require('app').getPath('userData');
  global.Mancy.session = _.clone(preferences);
})();

function onLoadSettings() {
  // font family
  ReplFonts.setFontFamily(global.Mancy.preferences.fontFamily);
  // page zoom factor
  webFrame.setZoomFactor(global.Mancy.preferences.pageZoomFactor);

  // water mark
  if(global.Mancy.preferences.watermark) {
    document.body.dataset.watermarkLogo = ReplConstants.REPL_WATERMARK_LOGO;
    document.body.dataset.watermarkMsg = ReplConstants.REPL_WATERMARK_MSG;
  }
}

// react entry point
(() => {
  onLoadSettings();
  const repl = document.getElementById('node-repl-plus');
  React.render(<Repl />, repl);
  const suggestion = document.getElementById('node-repl-prompt-suggestions');
  React.render(<ReplSuggestions />, suggestion);
  const preferences = document.getElementById('node-repl-preferences');
  React.render(<ReplPreferences />, preferences);
})();

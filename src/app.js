


import React from 'react';
import ReplSuggestions from './components/ReplSuggestions';
import ReplPreferences from './components/ReplPreferences';
import Repl from './components/Repl';
import ReplConstants from './constants/ReplConstants';
import ReplFonts from './common/ReplFonts';
import _ from 'lodash';
import {ipcRenderer, remote, webFrame} from 'electron';

try {
	
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
	
	const addNewPreferences = (defaults, preferences) => {
		_.each(_.keys(defaults), (key) => {
			if (!(key in preferences)) {
				preferences[key] = defaults[key];
			}
			else if (typeof preferences[key] === 'object') {
				addNewPreferences(defaults[key], preferences[key]);
			}
		});
	};

// preferences & user data path
	(() => {
		let preferences = JSON.parse(localStorage.getItem('preferences') || '{}');
		let defaults = {
			"editor": "REPL",
			"mode": "Sloppy",
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
			"keyMap": "default",
			"npmPaths": [],
			"historySize": ReplConstants.REPL_HISTORY_SIZE,
			"historyAggressive": false,
			"executionTime": false,
			"indentUnit": 2,
			"tabSize": 4,
			"typescript": {
				"noImplicitAny": false,
				"ignoreSemanticError": true,
				"preserveConstEnums": true,
				"allowUnusedLabels": true,
				"noImplicitReturns": false,
				"noFallthroughCasesInSwitch": true,
				"allowUnreachableCode": false,
				"forceConsistentCasingInFileNames": false,
				"allowSyntheticDefaultImports": true,
				"allowJs": true,
				"noImplicitUseStrict": false,
				"noEmitHelpers": true
			},
			"clojurescript": {
				"preamble-missing": true,
				"undeclared-var": true,
				"undeclared-ns": true,
				"undeclared-ns-form": true,
				"redef": true,
				"dynamic": true,
				"fn-var": true,
				"fn-arity": true,
				"fn-deprecated": true,
				"protocol-deprecated": true,
				"undeclared-protocol-symbol": true,
				"invalid-protocol-symbol": true,
				"multiple-variadic-overloads": true,
				"variadic-max-arity": true,
				"overload-arity": true,
				"extending-base-js-type": true,
				"invoke-ctor": true,
				"invalid-arithmetic": true,
				"protocol-invalid-method": true,
				"protocol-duped-method": true,
				"protocol-multiple-impls": true,
				"single-segment-namespace": true,
				"parinfer": {
					"mode": "off",
					"previewCursorScope": false
				}
			},
		};
		
		addNewPreferences(defaults, preferences);
		
		if (preferences.mode === 'Magic') {
			preferences.mode = 'Sloppy';
		}
		global.Mancy = {preferences: preferences};
		localStorage.setItem('preferences', JSON.stringify(preferences));
		
		global.Mancy.userData = remote.app.getPath('userData');
		global.Mancy.session = _.clone(preferences);
	})();
	
	function onLoadSettings() {
		// font family
		ReplFonts.setFontFamily(global.Mancy.preferences.fontFamily);
		// page zoom factor
		webFrame.setZoomFactor(global.Mancy.preferences.pageZoomFactor);
		
		// water mark
		if (global.Mancy.preferences.watermark) {
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
} catch (err) {
  console.error(`failed to init`,err)
}
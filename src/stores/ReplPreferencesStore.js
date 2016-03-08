import ReplPreferencesActions from '../actions/ReplPreferencesActions';
import ReplActions from '../actions/ReplActions';
import ReplLanguages from '../languages/ReplLanguages';
import ReplActiveInputActions from '../actions/ReplActiveInputActions';
import ReplStatusBarActions from '../actions/ReplStatusBarActions';
import ReplFonts from '../common/ReplFonts';
import Reflux from 'reflux';
import _ from 'lodash';
import {ipcRenderer} from 'electron';
import webFrame from 'web-frame';
import ReplConstants from '../constants/ReplConstants';
import ReplContext from '../common/ReplContext';
import ReplCommon from '../common/ReplCommon';
import remote from 'remote';

let open = false;
const ReplPreferencesStore = Reflux.createStore({
  init() {
    this.listenToMany(ReplPreferencesActions);
  },
  onOpenPreferences() {
    if(open) { return; }
    open = true;
    this.trigger(open);
  },
  onClosePreferences() {
    if(!open) { return; }
    open = false;
    this.trigger(open);
  },
  onTogglePreferences() {
    open = !open;
    this.trigger();
  },
  updatePreference(cb) {
    let preferences = JSON.parse(localStorage.getItem('preferences'));
    cb(preferences);
    global.Mancy.preferences = preferences;
    localStorage.setItem('preferences', JSON.stringify(preferences));
    ipcRenderer.send('application:sync-preference', preferences);
    ReplStatusBarActions.refresh();
    this.trigger();
  },
  toggleWatermark(flag) {
    this.updatePreference((preferences) => {
      preferences.watermark = flag;
      if(preferences.watermark) {
        document.body.dataset.watermarkLogo = ReplConstants.REPL_WATERMARK_LOGO;
        document.body.dataset.watermarkMsg = ReplConstants.REPL_WATERMARK_MSG;
      } else {
        document.body.dataset.watermarkLogo = '';
        document.body.dataset.watermarkMsg = '';
      }
    });
  },
  toggleBabel(flag) {
    this.updatePreference((preferences) => {
      preferences.babel = flag;
      global.Mancy.session.babel = flag;
    });
  },
  toggleAutomaticAutoComplete(flag) {
    this.updatePreference((preferences) => {
      preferences.toggleAutomaticAutoComplete = flag;
    });
  },
  toggleAsyncWrap(flag) {
    this.updatePreference((preferences) => {
      preferences.asyncWrap = flag;
    });
  },
  toggleShiftEnter(flag) {
    this.updatePreference((preferences) => {
      preferences.toggleShiftEnter = flag;
    });
  },
  toggleAutoCompleteOnEnter(flag) {
    this.updatePreference((preferences) => {
      preferences.autoCompleteOnEnter = flag;
    });
  },
  toggleTranspile(flag) {
    this.updatePreference((preferences) => {
      preferences.transpile = flag;
    });
  },
  togglePromptOnClose(flag) {
    this.updatePreference((preferences) => {
      preferences.promptOnClose = flag;
      ipcRenderer.send('application:prompt-on-close', flag);
    });
  },
  toggleHistoryAggressive(flag) {
    this.updatePreference((preferences) => {
      preferences.historyAggressive = flag;
      ipcRenderer.send('application:history-aggressive', flag);
    });
  },
  onSetHistorySize(size) {
    this.updatePreference((preferences) => {
      preferences.historySize = size;
      ipcRenderer.send('application:history-size', size);     
    });
  },
  onSetTheme(name) {
    this.updatePreference((preferences) => {
      preferences.theme = name;
      global.Mancy.session.theme = name;
      document.body.className = name.toLowerCase().replace(/\s/, '-');
    });
  },
  onSetKeyMap(keyMap) {
    this.updatePreference((preferences) => {
      preferences.keyMap = keyMap;
      global.Mancy.session.keyMap = keyMap;
      ReplActiveInputActions.setEditorOption({name: 'keyMap', value: keyMap});
    });
  },
  onChangeFontFamily(family) {
    this.updatePreference((preferences) => {
      preferences.fontFamily = family;
      ReplFonts.setFontFamily(family);
    });
  },
  onChangePageZoomFactor(zoom) {
    this.updatePreference((preferences) => {
      preferences.pageZoomFactor = zoom;
      webFrame.setZoomFactor(zoom);
    });
  },
  onSetREPLMode(mode) {
    this.updatePreference((preferences) => {
      preferences.mode = mode;
      global.Mancy.session.mode = mode;
      ReplStatusBarActions.updateMode(mode);
      ReplActions.setREPLMode(mode);
    });
  },
  onSetEditorMode(mode) {
    this.updatePreference((preferences) => {
      preferences.editor = mode;
      global.Mancy.session.editor = mode;
      let win = remote.getCurrentWindow();
      win.webContents.send('application:editor-mode', mode);
    });
  },
  onSetLanguage(lang) {
    this.updatePreference((preferences) => {
      preferences.lang = lang;
      ReplLanguages.setREPL(lang);
      global.Mancy.session.lang = lang;
      ReplStatusBarActions.updateLanguage();
      ReplActiveInputActions.breakPrompt();
    });
  },
  onSetSuggestionDelay(delay) {
    this.updatePreference((preferences) => {
      preferences.suggestionDelay = parseInt(delay, 10) || 0;
      ReplActiveInputActions.updateSuggestionDelay();
    });
  },
  onSetExeTimeout(timeout) {
    this.updatePreference((preferences) => {
      preferences.timeout = parseInt(timeout, 10) || 0;
    });
  },
  onSelectLoadScript(script) {
    this.updatePreference((preferences) => {
      preferences.loadScript = script;
    });
  },
  addNPMPath(path) {
    this.updatePreference((preferences) => {
      let npmPaths = preferences.npmPaths;
      if(npmPaths.indexOf(path) === -1) {
        let paths = [path];
        preferences.npmPaths = paths.concat(npmPaths);
        ReplCommon.addToPath(paths, ReplContext.getContext());
      }
    });
  },
  removeNPMPath(path) {
    this.updatePreference((preferences) => {
      let npmPaths = preferences.npmPaths, idx;
      if(npmPaths.length && (idx = npmPaths.indexOf(path)) !== -1) {
        preferences.npmPaths.splice(idx, 1);
        ReplCommon.removeFromPath([path], ReplContext.getContext());
      }
    });
  },
  moveNPMPath(path, adj = 1) {
    this.updatePreference((preferences) => {
      let npmPaths = preferences.npmPaths, idx;
      if(npmPaths.length && (idx = npmPaths.indexOf(path)) !== -1
        && (idx + adj) >= 0 && (idx + adj) < npmPaths.length) {
        let x = npmPaths[idx];
        let y = npmPaths[idx + adj];
        ReplCommon.removeFromPath(npmPaths, ReplContext.getContext());
        npmPaths[idx] = y;
        npmPaths[idx + adj] = x;
        ReplCommon.addToPath(npmPaths, ReplContext.getContext());
      }
    });
  },
  resetNPMPaths() {
    this.updatePreference((preferences) => {
      let npmPaths = preferences.npmPaths;
      if(npmPaths.length) {
        preferences.npmPaths = [];
        ReplCommon.removeFromPath(npmPaths, ReplContext.getContext());
      }
    });
  },
  toggleFoldGutter(flag) {
    this.updatePreference((preferences) => {
      preferences.toggleFoldGutter = flag;
      ReplActiveInputActions.setEditorOption({name: 'foldGutter', value: flag});
    });
  },
  toggleLineNumberGutter(flag) {
    this.updatePreference((preferences) => {
      preferences.toggleLineNumberGutter = flag;
      ReplActiveInputActions.setEditorOption({name: 'lineNumbers', value: flag});
    });
  },
  getStore() {
    let preferences = JSON.parse(localStorage.getItem('preferences'));
    return _.extend({ open: open }, preferences);
  }
});
export default ReplPreferencesStore;

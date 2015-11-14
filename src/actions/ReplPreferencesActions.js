import Reflux from 'reflux';

const ReplPreferencesActions = Reflux.createActions([
  "togglePreferences",
  "openPreferences",
  "closePreferences",
  "setTheme",
  "setREPLMode",
  "changeFontFamily",
  "changePageZoomFactor",
]);
export default ReplPreferencesActions;

import Reflux from 'reflux';

const ReplStatusBarActions = Reflux.createActions([
  "updateRunCommand",
  "newRelease",
  "updateLanguage",
  "updateMode",
  "refresh",
  "cursorActivity"
]);
export default ReplStatusBarActions;

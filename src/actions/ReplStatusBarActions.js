import Reflux from 'reflux';

const ReplStatusBarActions = Reflux.createActions([
  "updateRunCommand",
  "newRelease",
  "updateLanguage",
  "updateTranspile",
  "updateMode",
  "refresh"
]);
export default ReplStatusBarActions;

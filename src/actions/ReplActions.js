import Reflux from 'reflux';

const ReplActions = Reflux.createActions([
  "addEntry",
  "removeEntry",
  "reloadPrompt",
  "reloadPromptByIndex",
  "toggleCommandEntryView",
  "toggleEntryView",
  "setREPLMode",
  "overrideLastOutput"
]);
export default ReplActions;

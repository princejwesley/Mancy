import Reflux from 'reflux';

const ReplActions = Reflux.createActions([
  "addEntry",
  "removeEntry",
  "reloadPrompt",
  "reloadPromptByIndex",
  "toggleCommandEntryView",
  "toggleEntryView",
  "setREPLMode",
  "setEditorMode",
  "overrideLastOutput",
  "bindObjectToContext",
]);
export default ReplActions;

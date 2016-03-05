import Reflux from 'reflux';

const ReplActiveInputActions = Reflux.createActions([
  "tabCompleteSuggestion",
  "resetTabCompleteSuggestion",
  "fillTabCompleteSuggestion",
  "breakPrompt",
  "formatCode",
  "playCommands",
  "updateSuggestionDelay",
  "performAutoComplete",
  "setTheme",
  "setEditorOption",
  "undo",
  "redo",
  "focus",
]);
export default ReplActiveInputActions;

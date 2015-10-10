import Reflux from 'reflux';

const ReplActiveInputActions = Reflux.createActions([
  "tabCompleteSuggestion",
  "resetTabCompleteSuggestion",
  "fillTabCompleteSuggestion",
  "breakPrompt",
  "formatCode",
  "playCommands"
]);
export default ReplActiveInputActions;

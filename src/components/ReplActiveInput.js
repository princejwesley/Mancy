import React from 'react';
import _ from 'lodash';
import repl from 'repl';
import {Readable, Writable} from 'stream';
import {EOL} from 'os';
import shell from 'shell';
import ReplSuggestionActions from '../actions/ReplSuggestionActions';
import ReplActions from '../actions/ReplActions';
import ReplConstants from '../constants/ReplConstants';
import ReplType from '../common/ReplType';
import ReplCommon from '../common/ReplCommon';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplDOM from '../common/ReplDOM';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
    this.onTabCompletion = this.onTabCompletion.bind(this);
    this.autoComplete = this.autoComplete.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }
  componentDidMount() {
    this.element = React.findDOMNode(this);
    this.focus();

    let cli = ReplActiveInput.getRepl();
    cli.output.write = this.addEntry.bind(this);
    //scroll to bottom
    ReplDOM.scrollToEnd();
  }

  componentWillUnmount() {
    let cli = ReplActiveInput.getRepl();
    cli.output.write = () => {};
  }

  focus() {
    // focus
    ReplDOM.focusOn(this.element);
    ReplDOM.setCursorPosition(this.props.cursor || 0, this.element);
  }

  addEntry(buf) {
    let entry = buf.toString() || '';
    if(entry.length === 0 || entry.match(/^\.+\s*$/)) { return; }
    let [exception, ...stackTrace] = entry.split(EOL);
    let status = (ReplCommon.isExceptionMessage(exception)
        && ReplCommon.isStackTrace(stackTrace));

    const text = this.element.innerText;
    ReplActions.addEntry({
      entry: entry,
      status: !status,
      command: ReplCommon.highlight(text),
      plainCode: text
    });
    ReplSuggestionActions.removeSuggestion();
  }

  autoComplete(__, completion) {
    let [list, ] = completion;
    let suggestions = _.chain(list)
      .filter((suggestion) => {
        return suggestion && suggestion.length !== 0;
      })
      .map((suggestion) => {
        return {
          type: ReplType.typeOf(suggestion),
          text: suggestion.replace(/^.*\./, '')
        };
      })
      .value();

    if(suggestions.length) {
      const text = this.element.innerText;
      ReplSuggestionActions.addSuggestion({suggestions: suggestions, input: text});
    } else {
      ReplSuggestionActions.removeSuggestion();
    }
  }

  onTabCompletion(__, completion) {

    console.log('inside tab completion')

    let [list, input] = completion;

    let breakReplaceWord = (word) => {
      let length = word.length;
      let rword = ReplCommon.reverseString(word);
      //extract prefix
      let prefix = ReplCommon.reverseString(rword.replace(/^\w+/, ''));
      console.log('rword', rword, 'o', prefix, word);
      return { prefix: prefix, suffix: word.substring(prefix.length) };
    }

    if(list.length === 0) {
      shell.beep();
      ReplSuggestionActions.removeSuggestion();
    } else if(list.length === 1) {
      const text = this.element.innerText;
      let lines = text.split(EOL);
      let currentLine = lines.pop();

      let cursorPosition = ReplDOM.getCursorPosition();
      let left = currentLine.substring(0, cursorPosition);
      let right = currentLine.substring(cursorPosition);
      let words = ReplCommon.toWords(left);
      let replaceWord = words.pop();
      let {prefix, suffix} = breakReplaceWord(replaceWord);
      let linesLength = ReplCommon.linesLength(lines);

      words.push(prefix + list[0].substring(list[0].indexOf(suffix)));
      left = words.join(' ');
      lines.push(left + right);

      // console.log('left', left, 'right', right, 'words', words, 'replaceWord', replaceWord, 'lines', lines, 'list', list)
      console.log([linesLength, left.length])
      ReplSuggestionActions.removeSuggestion();
      ReplActions.reloadPrompt({ command: lines.join(EOL), cursor: linesLength + left.length});
    } else {
      this.autoComplete(__, completion);
    }
  }

  onKeyUp(e) {
    this.lastKey = e.key;

    if(ReplDOMEvents.isTab(e)
      || ReplDOMEvents.isEscape(e)
      || ReplDOMEvents.isNavigation(e)
    ) {
      e.preventDefault();
      return;
    }

    console.log('key up', e)
    e.persist()

    let cli = ReplActiveInput.getRepl();
    const text = this.element.innerText.trim();
    if(ReplDOMEvents.isEnter(e)) {
      if(text.split(EOL).length > 1) {
        cli.input.emit('data', '.break');
        cli.input.emit('data', EOL);
      }
      cli.input.emit('data', text);
      cli.input.emit('data', EOL);
    } else {
      cli.complete(text, this.autoComplete);
    }
  }

  onKeyDown(e) {
    if( ReplDOMEvents.isKeyup(e)
      || ReplDOMEvents.isKeydown(e)
    ) {
      e.preventDefault();
      return;
    }
    if(!ReplDOMEvents.isTab(e)) { return; }
    e.preventDefault();

    let text = this.element.innerText || '';
//     const lines = text.split(EOL);
//     const lastLine = lines[lines.length - 1];

//     if(!lastLine.trim().length && lines.length > 1) {
//       if(this.lastKey === 'Enter' && !lastLine.length) {
//         text = lines.slice(0, lines.length - 1).join(EOL);
//       }
//       let command = [text, ReplCommon.times(ReplConstants.TAB_WIDTH, ' ')].join('');
//       ReplSuggestionActions.removeSuggestion();
//       ReplActions.reloadPrompt({
//         command: command,
//         cursor: command.length
//       });
//     } else {

      let cursor = ReplDOM.getCursorPosition();
      let words = ReplCommon.toWords(text.substring(0, cursor));
      let cli = ReplActiveInput.getRepl();
      cli.complete(words.pop(), this.onTabCompletion);
    // }

  }
  render() {
    return (
      <pre className='repl-active-input' tabIndex="-1" contentEditable={true}
        onKeyUp={this.onKeyUp}
        onKeyDown={this.onKeyDown}>
        {this.props.command}
      </pre>
    );
  }

  static getRepl = (() => {
    let readable = new Readable();
    let writable = new Writable();

    readable._read = writable.write = () => {};

    let nodeRepl = repl.start({
      prompt: '',
      input: readable,
      output: writable,
      terminal: false,
      // needed for better auto completion
      useGlobal: true,
      ignoreUndefined: false,
      useColors: false,
      historySize: ReplConstants.REPL_HISTORY_SIZE,
      replMode: repl[ReplConstants.REPL_MODE],
    });

    return () => {
      return nodeRepl;
    };
  })();

}

import React from 'react';
import _ from 'lodash';
import ReplSuggestionStore from '../stores/ReplSuggestionStore';
import Reflux from 'reflux';
import md5 from 'md5';
import {EOL} from 'os';
import ReplType from '../common/ReplType';
import ReplConstants from '../constants/ReplConstants';
import ReplDOMUtil from '../common/ReplDOMUtil';

export default class ReplSuggestions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: []
    };
    this.onStateChange = this.onStateChange.bind(this);
    this.onWindowEvents = this.onWindowEvents.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = ReplSuggestionStore.listen(this.onStateChange);
    window.addEventListener('keydown', this.onWindowEvents, false);
    window.addEventListener('blur', this.onWindowEvents, false);
  }

  componentWillUnmount() {
    this.unsubscribe();
    window.removeEventListener('keydown', this.onWindowEvents, false);
    window.addEventListener('blur', this.onWindowEvents, false);
  }

  onWindowEvents(e) {
    if(e.which === ReplConstants.KEY_ESCAPE
      || e.type === 'blur') {
      this.setState({
        suggestions: []
      });
    } else if(e.keyIdentifier === 'Down') {

    }
  }

  onStateChange(data) {
    let {suggestions, input} = data;
    suggestions = _.map(suggestions, (suggestion) => {
      let words = input.trim().split(/\s+/);
      let lastWord = words[words.length - 1];
      lastWord = lastWord.replace(/^.*\./, '');
      let expect = suggestion.text.substring(lastWord.length);

      return {
        key: md5(suggestion.text),
        type: ReplType.getTypeName(suggestion.type),
        typeHint: ReplType.getTypeNameShort(suggestion.type),
        expect: expect,
        input: suggestion.text.substring(0, lastWord.length)
      };
    });

    this.setState({
      suggestions: suggestions
    });
  }

  render() {
    return (
      <div className='repl-prompt-suggestion-wrapper' style={ReplDOMUtil.getAutoCompletePosition()}>
      {
        this.state.suggestions.length
          ?
          <ol className='repl-prompt-suggestion-list'>
            {
              _.map(this.state.suggestions, (suggestion, idx) => {
                return (
                  <li className='repl-prompt-suggestion' data-index={idx} key={suggestion.key} >
                    <span className='repl-prompt-suggestion-type' title={suggestion.type}>
                      {suggestion.typeHint}
                    </span>
                    <span className='repl-prompt-suggestion-text'>
                      <span className='repl-prompt-suggestion-highlight'>{suggestion.input}</span>
                      <span className='repl-prompt-suggestion-expect'>{suggestion.expect}</span>
                    </span>
                  </li>
                );
              })
            }
          </ol>
          : null
      }
      </div>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import ReplSuggestionStore from '../stores/ReplSuggestionStore';
import Reflux from 'reflux';
import md5 from 'md5';
import {EOL} from 'os';
import ReplType from '../common/ReplType';
import ReplConstants from '../constants/ReplConstants';
import ReplDOM from '../common/ReplDOM';
import ReplDOMEvents from '../common/ReplDOMEvents';
import ReplActiveInputActions from '../actions/ReplActiveInputActions';

export default class ReplSuggestions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      selected: -1
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
    // console.log(e.which, e.keyIdentifier, e)
    if(ReplDOMEvents.isEscape(e) || ReplDOMEvents.isBlurEvent(e)) {
      this.setState({
        suggestions: [],
        selected: -1
      });
      ReplActiveInputActions.resetTabCompleteSuggestion();      
    } else if((ReplDOMEvents.isKeyup(e) || ReplDOMEvents.isKeydown(e)) && this.state.suggestions.length) {
      let direction = ReplDOMEvents.isKeydown(e) ? 1 : -1;
      let noOfSuggestions = this.state.suggestions.length;
      let next = this.state.selected + direction;

      if(next < 0) { next = noOfSuggestions - 1; }
      else if(next >= noOfSuggestions) { next = 0; }
      this.setState({
        selected: next
      });

      // scroll to selected element
      let suggestionList = document.getElementsByClassName('repl-prompt-suggestion-list')[0];
      if(suggestionList) {
        suggestionList.scrollTop = (suggestionList.scrollHeight / this.state.suggestions.length) * next;
      }
      ReplActiveInputActions.tabCompleteSuggestion(this.state.suggestions[next]);
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
      suggestions: suggestions,
      selected: -1
    });

    ReplActiveInputActions.resetTabCompleteSuggestion();
  }

  render() {
    return (
      <div className='repl-prompt-suggestion-wrapper' style={ReplDOM.getAutoCompletePosition()}>
      {
        this.state.suggestions.length
          ?
          <ol className='repl-prompt-suggestion-list'>
            {
              _.map(this.state.suggestions, (suggestion, idx) => {
                return (
                  <li className='repl-prompt-suggestion' data-index={idx} key={suggestion.key} data-selected={this.state.selected === idx}>
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

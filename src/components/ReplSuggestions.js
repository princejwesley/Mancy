import React from 'react';
import _ from 'lodash';
import ReplSuggestionStore from '../stores/ReplSuggestionStore';
import Reflux from 'reflux';
import md5 from 'md5';

export default class ReplSuggestions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: []
    };
  }

  componentDidMount() {
    this.unsubscribe = ReplSuggestionStore.listen(this.onStateChange);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onStateChange(item) {
    console.log(item, 'item received @ repl suggestions')
  }

  render() {
    return (
      <ul className='repl-prompt-suggestion-list'>
      {
        _.map(this.state.suggestions, (suggestion) => {
          return (
            <li className='repl-prompt-suggestion' key='{md5(suggestion.text)}' >
              <div className='repl-prompt-suggestion-type'>
                {suggestion.type}
              </div>
              <div className='repl-prompt-suggestion-text'>
                {suggestion.text}
              </div>
            </li>
          );
        })
      }
    </ul>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import ReplSuggestionStore from '../stores/ReplSuggestionStore';
import Reflux from 'reflux';
import md5 from 'md5';
import ReplType from '../common/ReplType';

export default class ReplSuggestions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: []
    };
    this.onStateChange = this.onStateChange.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = ReplSuggestionStore.listen(this.onStateChange);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onStateChange(suggestions) {
    console.log(suggestions, 'repl suggestions')
    this.setState({
      suggestions: _.map(suggestions, (suggestion) => {
        console.log(suggestion.type)
        return {
          key: md5(suggestion.text),
          type: ReplType.getTypeName(suggestion.type),
          text: suggestion.text
        };
      })
    });
  }

  render() {
    return (
      <ul className='repl-prompt-suggestion-list'>
      {
        _.map(this.state.suggestions, (suggestion) => {
          return (
            <li className='repl-prompt-suggestion' key={suggestion.key} >
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

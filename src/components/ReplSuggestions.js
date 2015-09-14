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
      component: <div> {false} </div>
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
    suggestions = _.map(suggestions, (suggestion) => {
      return {
        key: md5(suggestion.text),
        type: ReplType.getTypeName(suggestion.type),
        text: suggestion.text
      };
    });

    let component = <div> {false} </div>

    if(suggestions.length)
      component =
        <ul className='repl-prompt-suggestion-list'>
          {
            _.map(suggestions, (suggestion) => {
              return (
                <li className='repl-prompt-suggestion' key={suggestion.key} >
                  <span className='repl-prompt-suggestion-type'>
                    {suggestion.type}
                  </span>
                  <span className='repl-prompt-suggestion-text'>
                    {suggestion.text}
                  </span>
                </li>
              );
            })
          }
        </ul>

    this.setState({
      component: component
    });
  }
  //TODO: handle escape key 
  render() {
    return (
      <div className='repl-prompt-suggestion-wrapper'> {this.state.component} </div>
    );
  }
}

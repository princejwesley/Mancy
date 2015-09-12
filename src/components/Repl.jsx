import React from 'react';
import _ from 'lodash';
import ReplEntry from './ReplEntry.jsx'
import ReplPrompt from './ReplPrompt.jsx'

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: []
    };
  }
  render() {
    return (
      <div className='repl-entries'>
        {
          _.map(this.state.entries, (entry) => {
            return <ReplEntry item='{entry}' />;
          })
        }
        <ReplPrompt />
      </div>
    );
  }
}

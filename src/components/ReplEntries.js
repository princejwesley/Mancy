import React from 'react';
import _ from 'lodash';
import ReplEntry from './ReplEntry';

export default class ReplEntries extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-entries'>
        {
          _.map(this.props.entries, (entry, pos) => {
            return <ReplEntry log={entry} index={pos} key={entry.tag}/>;
          })
        }
      </div>
    );
  }
}

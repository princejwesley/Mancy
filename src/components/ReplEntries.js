import React from 'react';
import _ from 'lodash';
import md5 from 'md5';
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
            return <ReplEntry entry={entry} key={md5(entry.command + pos)}/>;
          })
        }
      </div>
    );
  }
}

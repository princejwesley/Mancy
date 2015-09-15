import React from 'react';
import _ from 'lodash';
import md5 from 'md5';
import ReplEntry from './ReplEntry';

export default class ReplEntries extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    console.log(this.props.entries)
    return (
      <div className='repl-entries'>
        {
          _.map(this.props.entries, (entry) => {
            return <ReplEntry entry={entry}/>;
          })
        }
      </div>
    );
  }
}

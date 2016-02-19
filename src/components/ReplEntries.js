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
          _.chain(this.props.entries)
            .filter(entry => entry.plainCode && entry.plainCode.trim().length)
            .map((entry, pos) => {
              return <ReplEntry log={entry} index={pos} key={entry.tag}/>;
            })
            .value()
        }
      </div>
    );
  }
}

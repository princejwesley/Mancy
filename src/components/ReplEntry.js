import React from 'react';
import _ from 'lodash';

export default class ReplEntry extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-entries'>
        {
          _.map(this.props.entries, (entry) => {
            return <ReplEntry item='{entry}' />;
          })
        }
      </div>
    );
  }
}

import React from 'react';

export default class ReplEntryIcon extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-entry-icon'>
        <i className="fa fa-angle-left"></i>
      </div>
    );
  }
}

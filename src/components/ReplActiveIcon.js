import React from 'react';

export default class ReplActiveIcon extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-active-icon'>
        <i className="fa fa-angle-right"></i>
      </div>
    );
  }
}

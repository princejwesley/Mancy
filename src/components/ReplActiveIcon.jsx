import React from 'react';
import _ from 'lodash';

export default class ReplActiveIcon extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-active-icon'>
        <i className="fa fa-terminal"></i>
        <div className="repl-active-line">

        </div>
      </div>
    );
  }
}

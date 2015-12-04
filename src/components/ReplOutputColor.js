import React from 'react';
import ReplOutputString from './ReplOutputString';
import _ from 'lodash';

export default class ReplOutputColor extends React.Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props);
  }

  render() {
    let colorCode = { backgroundColor: this.props.str };
    return (
      <span className='repl-color'>
        <ReplOutputString str={this.props.str}/>
        <span className='repl-color-box' style={colorCode}> </span>
      </span>
    );
  }
}

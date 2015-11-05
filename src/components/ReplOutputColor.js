import React from 'react';
import ReplOutputString from './ReplOutputString';

export default class ReplOutputColor extends React.Component {
  constructor(props) {
    super(props);
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

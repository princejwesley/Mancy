import React from 'react';
import ReplOutput from '../../common/ReplOutput';

export default class ReplOutputCljsVal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <span className='repl-cljs-val' title={this.props.token.type}>
        <span className='cm-bracket prefix'>{this.props.token.prefix}</span>
        <span className='cm-atom value'>:val </span>{this.props.value}
        <span className='cm-bracket suffix'>{this.props.token.suffix}</span>
        <span className='tag'>{this.props.token.type}</span>
      </span>
    );
  }
}

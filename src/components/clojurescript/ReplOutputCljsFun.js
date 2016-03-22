import React from 'react';
import ReplOutput from '../../common/ReplOutput';

export default class ReplOutputCljsVal extends React.Component {
  constructor(props) {
    super(props);
    const type = this.props.token.type;
    const parts = type.split(/[\s.]/);
    this.type = parts[parts.length - 1];
  }

  render() {
    return (
      <span className='repl-cljs-val' title={this.props.token.type}>
        <span className='cm-bracket prefix'>{this.props.token.prefix}</span>
        {
          this.props.token.keywordPrefix
            ? <span className='cm-atom value'>{this.props.token.keywordPrefix} </span>
            : null
        }
        {this.props.value}
        <span className='cm-bracket suffix'>{this.props.token.suffix}</span>
        <span className='tag' title={this.props.token.type}>{this.type}</span>
      </span>
    );
  }
}

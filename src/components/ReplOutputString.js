import React from 'react';
import ReplConstants from '../constants/ReplConstants';

export default class ReplOutputString extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    };

    const str = this.props.str;
    let len = str.length;
    this.collapsable = len > (this.props.limit || ReplConstants.OUTPUT_TRUNCATE_LENGTH);
    if(this.collapsable) {
      this.prefix = str.slice(0, ReplConstants.OUTPUT_TRUNCATE_LENGTH/2);
      this.suffix = str.slice(len - ReplConstants.OUTPUT_TRUNCATE_LENGTH/2);
    }
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  render() {
    return (
      <span className='repl-string-fold'>
        {
          this.collapsable
            ? this.state.collapse
              ? <span className='repl-string'>
                  <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                  <span className='string ellipsis'>'{this.prefix}</span>
                  <span className='string'>{this.suffix}'</span>
                </span>
              : <span className='repl-string'>
                  <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                  <span className='string'>'{this.props.str}'</span>
                </span>
            : <span className='repl-string'>
                <span className='string'>'{this.props.str}'</span>
              </span>
        }
      </span>
    );
  }
}

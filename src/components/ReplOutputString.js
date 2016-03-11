import React from 'react';
import ReplConstants from '../constants/ReplConstants';
import _ from 'lodash';

export default class ReplOutputString extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    };

    const str = this.props.str;
    let len = str.length;
    let limit = this.props.limit || ReplConstants.OUTPUT_TRUNCATE_LENGTH;
    this.collapsable = len > limit - 1;
    if(this.collapsable) {
      this.prefix = str.slice(0, limit/2);
      this.suffix = str.slice(Math.max(limit/2, len - (limit/2)));
    }
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
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
                  <span className='cm-string ellipsis'>'{this.prefix}</span>
                  <span className='cm-string'>{this.suffix}'</span>
                </span>
              : <span className='repl-string'>
                  <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                  <span className='cm-string'>'{this.props.str}'</span>
                </span>
            : <span className='repl-string'>
                <span className='cm-string'>'{this.props.str}'</span>
              </span>
        }
      </span>
    );
  }
}

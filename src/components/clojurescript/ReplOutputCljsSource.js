import React from 'react';
import _ from 'lodash';

export default class ReplOutputCljsVar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
    };

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
      <span className='repl-cljs-source-fold'>
        {
          this.state.collapse
            ? <span className='repl-cljs-source'>
                <i className='fa fa-plus-square-o' onClick={this.onToggleCollapse}></i>
                {this.props.short}
              </span>
            : <span className='repl-cljs-source'>
                <i className='fa fa-minus-square-o' onClick={this.onToggleCollapse}></i>
                <span className='repl-cljs-source-code' dangerouslySetInnerHTML={{__html:this.props.source}}>
                </span>
              </span>
        }
      </span>
    );
  }
}

import React from 'react';
import _ from 'lodash';

export default class ReplOutputCljsDocs extends React.Component {
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
    let clazz = this.state.collapse ? 'fa fa-minus-square-o' : 'fa fa-plus-square-o';
    return (
      <span className='repl-cljs-docs-fold'>
        {
          <span className='repl-cljs-doc-list'>
            <i className={clazz} onClick={this.onToggleCollapse}></i>
            <span className='cm-atom title'>Documentation Viewer</span>
            {this.state.collapse ? this.props.docs : null}
          </span>
        }
      </span>
    );
  }
}

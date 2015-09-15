import React from 'react';
import ReplEntryIcon from './ReplEntryIcon';
import ReplEntryMessage from './ReplEntryMessage';
import ReplEntryStatus from './ReplEntryStatus';
import _ from 'lodash';

export default class ReplEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: false
    };
    this.expand = this.expand.bind(this);
    this.collapse = this.collapse.bind(this);
  }
  update(collapse) {
    this.setState({
      collapse: collapse
    });
  }
  expand() {
    this.update(false);
  }
  collapse() {
    this.update(true);
  }
  render() {
    console.log('collapse state', this.state.collapse)
    return (
      <div className='repl-entry'>
        <ReplEntryIcon />
        <ReplEntryMessage message={this.props.entry} collapse={this.state.collapse}/>
        <ReplEntryStatus message={this.props.entry} collapse={this.state.collapse} onCollapse={this.collapse} onExpand={this.expand}/>
      </div>
    );
  }
}

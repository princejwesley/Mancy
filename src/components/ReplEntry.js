import React from 'react';
import ReplEntryIcon from './ReplEntryIcon';
import ReplEntryMessage from './ReplEntryMessage';
import ReplEntryStatus from './ReplEntryStatus';
import ReplActions from '../actions/ReplActions';

export default class ReplEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: false
    };
    this.onExpand = this.onExpand.bind(this);
    this.onCollapse = this.onCollapse.bind(this);
    this.onReload = this.onReload.bind(this);
    this.onRemove = this.onRemove.bind(this);
  }
  update(collapse) {
    this.setState({
      collapse: collapse
    });
  }
  onExpand() {
    this.update(false);
  }
  onCollapse() {
    this.update(true);
  }
  onReload() {
    ReplActions.reloadPrompt(this.props.entry.plainCode);
  }
  onRemove() {
    ReplActions.removeEntry(this.props.index, this.props.entry);
  }
  render() {
    return (
      <div className='repl-entry'>
        <ReplEntryIcon />
        <ReplEntryMessage message={this.props.entry} collapse={this.state.collapse}/>
        <ReplEntryStatus message={this.props.entry} collapse={this.state.collapse}
          onReload={this.onReload}
          onRemove={this.onRemove}
          onCollapse={this.onCollapse}
          onExpand={this.onExpand}/>
      </div>
    );
  }
}

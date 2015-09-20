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
    this.onCommandCollapse = this.onCommandCollapse.bind(this);
  }
  update(collapse) {
    this.setState({
      collapse: collapse,
      commandCollapse: false
    });
  }
  onExpand() {
    this.update(false);
  }
  onCollapse() {
    this.update(true);
  }
  onReload() {
    let command = this.props.entry.plainCode;
    ReplActions.reloadPrompt({ command: command, cursor: command.length });
  }
  onRemove() {
    ReplActions.removeEntry(this.props.index, this.props.entry);
  }
  onCommandCollapse() {
    this.setState({
      commandCollapse: !this.state.commandCollapse
    });
  }
  render() {
    return (
      <div className='repl-entry'>
        <ReplEntryIcon collapse={this.state.commandCollapse} onCollapse={this.onCommandCollapse}/>
        <ReplEntryMessage message={this.props.entry} collapse={this.state.collapse}
          commandCollapse={this.state.commandCollapse}/>
        <ReplEntryStatus message={this.props.entry} collapse={this.state.collapse}
          onReload={this.onReload}
          onRemove={this.onRemove}
          onCollapse={this.onCollapse}
          onExpand={this.onExpand}/>
      </div>
    );
  }
}

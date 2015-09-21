import React from 'react';
import ReplEntryIcon from './ReplEntryIcon';
import ReplEntryMessage from './ReplEntryMessage';
import ReplEntryStatus from './ReplEntryStatus';
import ReplActions from '../actions/ReplActions';
import clipboard from 'clipboard';

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
    this.onCopyOutput = this.onCopyOutput.bind(this);
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
  onCopyOutput() {
    clipboard.writeText(this.props.log.output);
  }
  onReload() {
    let command = this.props.log.plainCode.trim();
    ReplActions.reloadPrompt({ command: command, cursor: command.length });
  }
  onRemove() {
    ReplActions.removeEntry(this.props.index, this.props.log);
  }
  onCommandCollapse() {
    this.setState({
      commandCollapse: !this.state.commandCollapse
    });
  }
  render() {
    return (
      <div className='repl-entry'>
        <ReplEntryIcon collapse={this.state.commandCollapse}
          onCollapse={this.onCommandCollapse}/>
        <ReplEntryMessage message={this.props.log} collapse={this.state.collapse}
          onCopyOutput={this.onCopyOutput}
          commandCollapse={this.state.commandCollapse}/>
        <ReplEntryStatus message={this.props.log} collapse={this.state.collapse}
          onReload={this.onReload}
          onRemove={this.onRemove}
          onCollapse={this.onCollapse}
          onExpand={this.onExpand}/>
      </div>
    );
  }
}

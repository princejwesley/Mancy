import React from 'react';
import ReplEntryIcon from './ReplEntryIcon';
import ReplEntryMessage from './ReplEntryMessage';
import ReplEntryStatus from './ReplEntryStatus';
import ReplActions from '../actions/ReplActions';
import clipboard from 'clipboard';
import _ from 'lodash';

export default class ReplEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: this.props.log.collapsed,
      commandCollapse: this.props.log.collapsed
    };

    _.each([
      'onExpand', 'onCollapse', 'onReload',
      'onCommandCollapse', 'onRemove',
    ], (field) => {
      this[field] = this[field].bind(this);
    });
  }
  componentWillReceiveProps(nextProps) {
    this.state = {
      collapse: nextProps.log.collapsed,
      commandCollapse: nextProps.log.collapsed
    };
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

import React from 'react';
import ReplEntryIcon from './ReplEntryIcon';
import ReplEntryMessage from './ReplEntryMessage';
import ReplEntryStatus from './ReplEntryStatus';
import ReplActions from '../actions/ReplActions';
import ReplNotebook from './ReplNotebook';
import _ from 'lodash';

export default class ReplEntry extends React.Component {
  constructor(props) {
    super(props);
    _.each([
      'onToggle', 'onReload',
      'onCommandCollapse', 'onRemove',
    ], (field) => {
      this[field] = this[field].bind(this);
    });
  }
  onToggle() {
    ReplActions.toggleEntryView(this.props.index);
  }
  onReload() {
    ReplActions.reloadPromptByIndex(this.props.index);
  }
  onRemove() {
    ReplActions.removeEntry(this.props.index, this.props.log);
  }
  onCommandCollapse() {
    ReplActions.toggleCommandEntryView(this.props.index);
  }

  renderNotebook() {
    return (
      <div className='repl-entry repl-notebook'>
        <ReplNotebook message={this.props.log} index={this.props.index}/>
      </div>
    );
  }

  renderREPL() {
    return (
      <div className='repl-entry'>
        <ReplEntryIcon collapse={this.props.log.commandCollapsed}
          onCollapse={this.onCommandCollapse}/>
        <ReplEntryMessage message={this.props.log} collapse={this.props.log.collapsed}
          commandCollapse={this.props.log.commandCollapsed}/>
        <ReplEntryStatus message={this.props.log} collapse={this.props.log.collapsed}
          onReload={this.onReload}
          onRemove={this.onRemove}
          onToggle={this.onToggle}/>
      </div>
    );
  }

  render() {
    return global.Mancy.preferences.editor === 'REPL' ? this.renderREPL() : this.renderNotebook();
  }
}

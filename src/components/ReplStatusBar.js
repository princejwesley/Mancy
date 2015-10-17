import React from 'react';
import shell from 'shell';
import ReplPreferencesActions from '../actions/ReplPreferencesActions';

export default class ReplStatusBar extends React.Component {
  constructor(props) {
    super(props);
    this.onDownload = this.onDownload.bind(this);
    this.onTriggerPreferences = this.onTriggerPreferences.bind(this);
  }
  extractStatusInfo() {
    let history = this.props.history;
    let errors = history.filter((h) => !h.status);
    let mode = this.props.mode.replace(/^.*_/,'').toLowerCase();
    return {
      commands: history.length - errors.length,
      errors: errors.length,
      mode: mode
    };
  }
  onDownload(e) {
    let url = (this.props.newRelease || {}).url;
    if(url) {
      shell.openExternal(url);
    }
  }
  onTriggerPreferences(e) {
    ReplPreferencesActions.togglePreferences();
  }
  render() {
    let {commands, errors, mode} = this.extractStatusInfo();
    return (
      <div className='repl-status-bar'>
        <span className='repl-status-bar-preference' title='Preferences'>
          <i className="fa fa-cog" onClick={this.onTriggerPreferences}></i>
        </span>
        <span className='repl-status-bar-commands' title='success commands'>
          <i className="fa fa-circle"></i>
          <span className='repl-status-bar-count'>{commands}</span>
        </span>
        <span className='repl-status-bar-errors' title='error outputs'>
          <i className="fa fa-circle"></i>
          <span className='repl-status-bar-count'>{errors}</span>
        </span>
        <span className='repl-status-bar-mode' title='REPL mode'>
          <i className="fa fa-tag"></i>
          <span className='repl-status-bar-message'>{mode}</span>
        </span>
        <span style={{flex: 1}}/>
        {
          this.props.newRelease
            ? <span className='console-release-notification' onClick={this.onDownload} title='Click to download'>
                 <i className="fa fa-download"></i> Update
              </span>
            : null
        }
        {
          this.props.showBell
            ? <i className="fa fa-bell console-notification"></i>
            : null
        }
        <span className='repl-status-bar-console' onClick={this.props.onToggleConsole} title='toggle console'>
          <span className="fa-stack">
            <i className="fa fa-terminal fa-stack-1x"></i>
            {
              this.props.showConsole
                ? <i className="fa fa-ban fa-stack-2x text-danger"></i>
                : null
            }

          </span>
        </span>
      </div>
    );
  }
}

import React from 'react';

export default class ReplStatusBar extends React.Component {
  constructor(props) {
    super(props);
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
  render() {
    let {commands, errors, mode} = this.extractStatusInfo();
    return (
      <div className='repl-status-bar'>
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

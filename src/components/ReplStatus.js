import React from 'react';

export default class ReplStatus extends React.Component {
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
        <span className='repl-status-bar-commands'>
          <i className="fa fa-thumbs-o-up"></i>
          <span className='repl-status-bar-count'>{commands}</span>
        </span>
        <span className='repl-status-bar-errors'>
          <i className="fa fa-thumbs-o-down"></i>
          <span className='repl-status-bar-count'>{errors}</span>
        </span>
        <span className='repl-status-bar-mode'>
          <i className="fa fa-check"></i>
          <span className='repl-status-bar-message'>{mode}</span>
        </span>
      </div>
    );
  }
}

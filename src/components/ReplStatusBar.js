import React from 'react';
import shell from 'shell';
import ReplPreferencesActions from '../actions/ReplPreferencesActions';
import ReplStatusBarStore from '../stores/ReplStatusBarStore';
import _ from 'lodash';

export default class ReplStatusBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.clone(ReplStatusBarStore.getStore());
    this.onDownload = this.onDownload.bind(this);
    this.onTriggerPreferences = this.onTriggerPreferences.bind(this);
    this.onStoreChange = this.onStoreChange.bind(this);
    this.getLangIcon = this.getLangIcon.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = ReplStatusBarStore.listen(this.onStoreChange);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onStoreChange() {
    this.setState(ReplStatusBarStore.getStore());
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
    let url = (this.state.newRelease || {}).url;
    if(url) {
      shell.openExternal(url);
    }
  }

  onTriggerPreferences(e) {
    ReplPreferencesActions.togglePreferences();
  }

  getLangIcon() {
    let lang = this.state.lang;
    if(lang === 'js') { return 'icon-javascript'; }

    return 'fa fa-language';
  }

  render() {
    let {commands, errors, mode} = this.extractStatusInfo();
    let runHelp = this.state.runCommand ? '⇧ + ↲' : '↲';
    let langIcon = this.getLangIcon();
    return (
      <div className='repl-status-bar'>
        <span className='repl-status-bar-preference' title='Preferences'>
          <i className="fa fa-cog" onClick={this.onTriggerPreferences}></i>
        </span>
        <span className='repl-status-bar-commands' title='Success Commands'>
          <i className="fa fa-circle"></i>
          <span className='repl-status-bar-count'>{commands}</span>
        </span>
        <span className='repl-status-bar-errors' title='Error Outputs'>
          <i className="fa fa-circle"></i>
          <span className='repl-status-bar-count'>{errors}</span>
        </span>
        <span className='repl-status-bar-lang' title='REPL language'>
          <i className={langIcon}></i>
          <span className='repl-status-bar-message'>{this.state.lang}</span>
        </span>
        {
          global.Mancy.preferences.lang === 'js'
            ? <span className='repl-status-bar-mode' title='REPL mode'>
                <i className="fa fa-tag"></i>
                <span className='repl-status-bar-message'>{mode}</span>
              </span>
            : null
        }
        <span className='run-help'>Press <span className='run-command'>{runHelp}</span> to <span className='run'>run</span></span>
        <span className='placeholder'></span>
        {
          this.state.newRelease
            ? <span className='console-release-notification' onClick={this.onDownload} title='Click to download'>
                 <i className="fa fa-download"></i> {this.state.newRelease.release}
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

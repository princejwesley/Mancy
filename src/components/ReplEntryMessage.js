import React from 'react';
import {EOL} from 'os';
import ReplCommon from '../common/ReplCommon';
import ReplConstants from '../constants/ReplConstants';

export default class ReplEntryMessage extends React.Component {
  constructor(props) {
    super(props);
  }

  getTimeStr(v, u) {
    return v ? `${v}${u}` : null;
  }

  showExecutionTime() {
    if(!this.props.message.time || !global.Mancy.preferences.executionTime) {
      return null;
    }

    let [s, n] = this.props.message.time;
    let m = parseInt(n / 1e6);
    let mi = parseInt((n - m * 1e6) / 1e3);
    n = n % 1e3;
    let time = [
      this.getTimeStr(s, 's'), this.getTimeStr(m, 'ms'),
      this.getTimeStr(mi,'µs'), this.getTimeStr(n, 'ns')
    ].filter(x => x !== null).join(':');

    let clazz = `fa fa-clock-o execution-time ${s > 10 ? 'red' : (s > 5 ? 'orange' : 'green')}`
    return <i className={clazz} title={time}></i>
  }

  render() {
    let shortEntry;
    if(this.props.commandCollapse) {
      let lines = this.props.message.plainCode.trim().split(EOL);
      if(lines.length > 1 || lines[0].length > ReplConstants.COMMAND_TRUNCATE_LENGTH){
        shortEntry = ReplCommon.highlight(lines[0].slice(0, ReplConstants.COMMAND_TRUNCATE_LENGTH));
      }
    }
    return (
      <div className='repl-entry-message'>
        <div className='repl-entry-command-container'>
        {
          this.props.commandCollapse && shortEntry
            ? <div key="short" className='repl-entry-message-command ellipsis'
                dangerouslySetInnerHTML={{__html:shortEntry}}>
              </div>
            : <div key="long" className='repl-entry-message-command'
                dangerouslySetInnerHTML={{__html:this.props.message.command.trim()}}>
              </div>
        }
        { this.props.message.ns ? <span className='tag' title='Namespace'>{this.props.message.ns}</span> : null }
        { this.showExecutionTime() }
        </div>
        { this.props.collapse ?
            null :
            <div className='repl-entry-message-output'>
              {this.props.message.transpiledOutput}
              {this.props.message.formattedOutput}
            </div>
        }
      </div>
    );
  }
}

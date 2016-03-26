import React from 'react';
import {EOL} from 'os';
import ReplCommon from '../common/ReplCommon';
import ReplConstants from '../constants/ReplConstants';

export default class ReplEntryMessage extends React.Component {
  constructor(props) {
    super(props);
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

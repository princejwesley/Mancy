import React from 'react';
import {EOL} from 'os';
import ReplCommon from '../common/ReplCommon';
import ReplOutput from '../common/ReplOutput';

export default class ReplEntryMessage extends React.Component {
  constructor(props) {
    super(props);
  }

  transformOutput() {
    return ReplOutput.highlightOutput(this.props.message.entry);
  }

  render() {
    let shortEntry;
    if(this.props.commandCollapse) {
      let lines = this.props.message.plainCode.trim().split(EOL);
      if(lines.length > 1) {
        shortEntry = ReplCommon.highlight(lines[0]);
      }
    }
    return (
      <div className='repl-entry-message'>
        {
          this.props.commandCollapse && shortEntry
            ? <pre key="short" className='repl-entry-message-command ellipsis'
                dangerouslySetInnerHTML={{__html:shortEntry}}>
              </pre>
            : <pre key="long" className='repl-entry-message-command'
                dangerouslySetInnerHTML={{__html:this.props.message.command.trim()}}>
              </pre>
        }
        { this.props.collapse ?
            null :
            <pre className='repl-entry-message-output'>
              {this.props.message.entry}
            </pre>
        }
      </div>
    );
  }
}

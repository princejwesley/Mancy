import React from 'react';
import {EOL} from 'os';
import ReplCommon from '../common/ReplCommon';
import ReplConstants from '../constants/ReplConstants';

export default class ReplOutputTranspile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
    };
    this.onToggleCollapse = this.onToggleCollapse.bind(this);

    let lines = this.props.output.trim().split(EOL);
    if(lines.length > 1 || lines[0].length > ReplConstants.COMMAND_TRUNCATE_LENGTH){
      this.shortEntry = ReplCommon.highlight(lines[0].slice(0, ReplConstants.COMMAND_TRUNCATE_LENGTH));
    }
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  render() {
    return (
      <div className='repl-entry-message-output'>
        {
          this.shortEntry
            ? this.state.collapse
                ? <span className='repl-entry-message-output-function'>
                    <i className='fa fa-plus-square-o' onClick={this.onToggleCollapse}></i>
                    <span dangerouslySetInnerHTML={{__html:this.shortEntry}}></span>
                  </span>
                : <span className='repl-entry-message-output-function'>
                    <i className='fa fa-minus-square-o' onClick={this.onToggleCollapse}></i>
                    <span dangerouslySetInnerHTML={{__html:this.props.html}}></span>
                  </span>
            : <span className='repl-entry-message-output-function' dangerouslySetInnerHTML={{__html:this.props.html}}>
              </span>
        }
      </div>
    );
  }
}

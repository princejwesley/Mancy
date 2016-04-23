import React from 'react';
import ReplActiveIcon from './ReplActiveIcon';
import ReplActiveInput from './ReplActiveInput';

export default class ReplPrompt extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    let key = this.props.tag || `prompt-${(Math.random() * Math.pow(10, 9)) | 0}`;
    return (
      <div className='repl-prompt'>
        <ReplActiveIcon />
        <ReplActiveInput
          key={key}
          tag={key}
          history={this.props.history}
          historyIndex={this.props.historyIndex}
          historyStaged={this.props.historyStaged}
          command={this.props.command}
          cursor={this.props.cursor}/>
      </div>
    );
  }
}

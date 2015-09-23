import React from 'react';
import ReplActiveIcon from './ReplActiveIcon';
import ReplActiveInput from './ReplActiveInput';

export default class ReplPrompt extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-prompt'>
        <ReplActiveIcon />
        <ReplActiveInput
          mode={this.props.mode}
          history={this.props.history}
          historyIndex={this.props.historyIndex}
          historyStaged={this.props.historyStaged}
          command={this.props.command}
          cursor={this.props.cursor}/>
      </div>
    );
  }
}

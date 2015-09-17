import React from 'react';
import ReplActiveIcon from './ReplActiveIcon';
import ReplActiveInput from './ReplActiveInput';

export default class ReplPrompt extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    console.log('cursor', this.props)
    return (
      <div className='repl-prompt'>
        <ReplActiveIcon />
        <ReplActiveInput command={this.props.command} cursor={this.props.cursor}/>
      </div>
    );
  }
}

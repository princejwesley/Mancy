import React from 'react';
import _ from 'lodash';
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
        <ReplActiveInput />
      </div>
    );
  }
}

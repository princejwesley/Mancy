import React from 'react';
import ReplPrompt from './ReplPrompt';

export default class ReplNotebook extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let {id, tag, plainCode, cursor, transpiledOutput, formattedOutput} = this.props.message;
    return (
      <div className='repl-entry-message repl-notebook'>
        {
          <ReplPrompt key={tag}
            tag={id}
            history={[]}
            historyIndex={this.props.index}
            historyStaged=''
            command={plainCode}
            cursor= {cursor} />
        }
        <div className='repl-entry-message-output'>
          {transpiledOutput}
          {formattedOutput}
        </div>
      </div>
    );
  }
}

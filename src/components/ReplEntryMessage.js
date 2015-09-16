import React from 'react';

export default class ReplEntryMessage extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-entry-message'>
        <pre className='repl-entry-message-command' dangerouslySetInnerHTML={{__html:this.props.message.command.trim()}}>
        </pre>
        { this.props.collapse ?
            null :
            <pre className='repl-entry-message-entry'>
              {this.props.message.entry.trim()}
            </pre>
        }
      </div>
    );
  }
}

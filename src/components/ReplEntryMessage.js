import React from 'react';

export default class ReplEntryMessage extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-entry-message'>
        <div className='repl-entry-message-command' dangerouslySetInnerHTML={{__html:this.props.message.command}}>
        </div>
        { this.props.collapse ?
            null :
            <div className='repl-entry-message-entry'>
              {this.props.message.entry}
            </div>
        }
      </div>
    );
  }
}

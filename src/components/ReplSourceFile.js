import React from 'react';
import shell from 'shell';

export default class ReplSourceFile extends React.Component {
  constructor(props) {
    super(props);
    this.openExternalFile = this.openExternalFile.bind(this);
  }
  openExternalFile() {
    shell.openItem(this.props.location);
  }
  render() {
    return (
      <span className='repl-source-access'>
      {
          this.props.location
            ?
              <span className='repl-source-file' title={this.props.location}>
                {this.props.name}
                <i className="fa fa-external-link" onClick={this.openExternalFile}></i>
              </span>
            :
            <span className='repl-no-source-file'>Unable to find source file for <span className='name'>'{this.props.name}'</span> module</span>
      }
    </span>
    );
  }
}

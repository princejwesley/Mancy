import React from 'react';
import shell from 'shell';
import ReplCommon from '../common/ReplCommon';
import url from 'url';
import _ from 'lodash';

export default class ReplOutputURL extends React.Component {
  constructor(props) {
    super(props);
    this.openExternalFile = this.openExternalFile.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props);
  }

  openExternalFile() {
    let u = url.parse(this.props.url);
    if(u.protocol) {
      shell.openExternal(this.props.url);
    } else if(ReplCommon.isFile(this.props.url)) {
      shell.openExternal(`file://${this.props.url}`);
    } else {
      shell.openExternal(`http://${this.props.url}`);
    }
  }
  render() {
    return (
      <span className='repl-output-url'>
      {
        <span className='repl-url' title={this.props.url}>
          {this.props.url}
          <i className="fa fa-external-link" onClick={this.openExternalFile}></i>
        </span>
      }
    </span>
    );
  }
}

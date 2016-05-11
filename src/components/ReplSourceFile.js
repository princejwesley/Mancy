import React from 'react';
import {shell} from 'electron';
import ReplCommon from '../common/ReplCommon';
import ReplActiveInput from '../components/ReplActiveInput';

export default class ReplSourceFile extends React.Component {
  constructor(props) {
    super(props);
    this.openExternalFile = this.openExternalFile.bind(this);
  }
  openExternalFile() {
    shell.openItem(this.props.location);
  }
  render() {
    let isNativeModule = false;
    if(!this.props.location) {
      const nativeModules = ReplCommon.getNativeModules(ReplActiveInput.getRepl().context);
      isNativeModule = nativeModules.indexOf(this.props.name) !== -1;
    }

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
            (
              isNativeModule
                ? <span className='repl-no-source-file'><span className='name'>'{this.props.name}'</span> is native module</span>
                : <span className='repl-no-source-file'>Unable to find source file for <span className='name'>'{this.props.name}'</span> module</span>
            )
      }
    </span>
    );
  }
}

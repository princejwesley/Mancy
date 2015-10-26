import React from 'react';
import _ from 'lodash';
import ReplSourceFile from './ReplSourceFile';
import ReplContext from '../common/ReplContext';
import ReplCommon from '../common/ReplCommon';

export default class ReplEntryOutputError extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  highlightMessage(msg) {
    let output = msg;
    let filler = (match, p1, p2) => {
      if(p1 && p2) {
        output =
          <span className='repl-entry-output-error-message-heading'>
            <span className='error-name'>{p1}</span>: <span className='error-description'>{p2}</span>
          </span>
      }
    };
    msg.replace(/^([^:]+):(.*)$/, filler);
    return output;
  }

  highlightException(stack) {
    let output = []
    let filler = (match, p1, p2, p3, p4) => {
      let openBrace = '', closeBrace = '';
      if(p1.trim().length) {
        openBrace = '(';
        closeBrace = ')';
      }
      let context = ReplContext.getContext();
      let location = ReplCommon.getModuleSourcePath(p2, context.module.paths);
      if(location) { p2 = <ReplSourceFile location= {location} name={p2}/> }

      output.push(
        <div className='repl-entry-output-error-stack-lines' key={output.length}>
          <span className='stack-error-at'>&nbsp;&nbsp;at</span>
          <span className='stack-error-function'>{p1}</span>
          {openBrace}
          <span className='stack-error-file'>{p2}</span>:
          <span className='stack-error-row'>{p3}</span>:
          <span className='stack-error-column'>{p4}</span>
          {closeBrace}
        </div>
      );
      return '';
    };

    _.each(stack, (s) => {
      s.replace(/(?:at)(.*\s)\(?([\w.]+):(\d+):(\d+)\)?/, filler);
    });
    return output;
  }

  render() {
    return (
      <span className='repl-entry-output-error'>
        {
          this.state.collapse
            ? <span className='repl-entry-output-error-message'>
                <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                {this.highlightMessage(this.props.message)}
              </span>
            : <span className='repl-entry-output-error-message'>
                <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                {this.highlightMessage(this.props.message)}
                <span className='repl-entry-output-error-stack' >
                  {this.highlightException(this.props.trace)}
                </span>
              </span>
        }
      </span>
    );
  }
}

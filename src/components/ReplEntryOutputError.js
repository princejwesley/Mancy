import React from 'react';
import _ from 'lodash';
import ReplSourceFile from './ReplSourceFile';
import ReplContext from '../common/ReplContext';
import ReplCommon from '../common/ReplCommon';

const STACK_TRACE_PRIMARY_PATTERN = /(?:at\s*)([^(]+)\(?([^:]+):(\d+):(\d+)\)?/;
const STACK_TRACE_SECONDARY_PATTERN = /(?:at\s*)()([^:]+):(\d+):(\d+)/;
export default class ReplEntryOutputError extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);

    this.message = this.highlightMessage(this.props.message);

    if (this.props.syntaxError) {
      let {error, caret, file} = this.props.syntaxError;
      let caretPosition = caret.indexOf('^');
      let [start, mid, end] = [
        error.substring(0, caretPosition),
        error.substring(caretPosition, caret.length),
        error.substring(caret.length)
      ];
      let errorFile = this.highlightMessage(/mancy-repl:/.test(file) ? '' : file.trim());
      this.syntaxError = <div className="syntax-error">
        <span className="err-filename">{errorFile}</span>
        <span dangerouslySetInnerHTML={{__html:ReplCommon.highlight(start)}}></span>
        <span className="err-underline">{mid}</span>
        <span dangerouslySetInnerHTML={{__html:ReplCommon.highlight(end)}}></span>
        <div>{this.message}</div>
      </div>
      this.stacktrace = [];
    } else {
      this.stacktrace = this.highlightException(this.props.trace);
    }
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
            <span className='error-name'>{p1}</span>:<span className='error-description'>{p2}</span>
          </span>
      }
    };
    msg.replace(/^([^:]+):(.*)$/, filler);
    return output;
  }

  highlightException(stack) {
    // revisit: top two stacks are ours ?
    // stack = stack.slice(2);
    let output = [];
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
          <span className='stack-error-at'>&nbsp;&nbsp;at&nbsp;</span>
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
      s.replace(s.indexOf('(') !== -1 ? STACK_TRACE_PRIMARY_PATTERN : STACK_TRACE_SECONDARY_PATTERN, filler);
    });
    return output;
  }

  render() {
    return (
      <span className='repl-entry-output-error'>
        {
          !this.stacktrace.length
            ? <span className='repl-entry-output-error-message'>
                {this.syntaxError}
              </span>
            : this.state.collapse
              ? <span className='repl-entry-output-error-message'>
                  <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                  {this.message}
                </span>
              : <span className='repl-entry-output-error-message'>
                  <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                  {this.message}
                  <span className='repl-entry-output-error-stack' >
                    {this.stacktrace}
                  </span>
                </span>
        }
      </span>
    );
  }
}

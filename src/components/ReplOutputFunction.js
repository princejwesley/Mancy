import React from 'react';
import {EOL} from 'os';
import ReplCommon from '../common/ReplCommon';

export default class ReplOutputFunction extends React.Component {
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

  render() {
    return (
        this.props.expandable
          ? this.state.collapse
              ? <div className='repl-entry-message-output-function'>
                  <div dangerouslySetInnerHTML={{__html:this.props.short}}></div>
                  <i className='fa fa-plus-square-o' onClick={this.onToggleCollapse}></i>
                </div>
              : <div className='repl-entry-message-output-function'>
                  <div dangerouslySetInnerHTML={{__html:this.props.html}}></div>
                  <i className='fa fa-minus-square-o' onClick={this.onToggleCollapse}></i>
                </div>
          : <div className='repl-entry-message-output-function' dangerouslySetInnerHTML={{__html:this.props.html}}>
            </div>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import ReplOutput from '../common/ReplOutput';
import ReplCommon from '../common/ReplCommon';
import ReplOutputObject from './ReplOutputObject';
import ReplOutputBufferExplorer from './ReplOutputBufferExplorer'

export default class ReplOutputBuffer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
      explorerCollapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onToggleExplorerCollapse = this.onToggleExplorerCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onToggleExplorerCollapse() {
    this.setState({
      explorerCollapse: !this.state.explorerCollapse
    });
  }

  render() {
    let label = ReplCommon.highlight(` Buffer (${this.props.buffer.length} bytes) {}`);
    return (
      <span className='repl-entry-message-output-object-folds'>
        {
          this.state.collapse
          ? <span className='repl-entry-message-output-object'>
              <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
              <span className='object-desc' dangerouslySetInnerHTML={{__html:label}}></span>
            </span>
          : <span className='repl-entry-message-output-object'>
              <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
              <span className='object-desc' dangerouslySetInnerHTML={{__html:label}}></span>
              <span className='object-rec'>
              {
                <div className='object-entry' key='data'>
                  {this.props.buffer.length ? '0 - ' + this.props.buffer.length : '0'}
                  <span className='object-colon'>: </span>
                  {ReplOutput.transformObject(ReplCommon.toArray(this.props.buffer))}
                </div>
              }
              {
                <div className='object-entry' key='length'>
                  length
                  <span className='object-colon'>: </span>
                  <span className='number'>{this.props.buffer.length} </span>
                </div>
              }
              {
                this.props.buffer.__proto__
                ?  <div className='object-entry' key='prototype'>
                      __proto__
                      <span className='object-colon'>: </span>
                      <ReplOutputObject object={Object.getPrototypeOf(this.props.buffer)} primitive={false}/>
                  </div>
                : null
              }
              {
                this.props.buffer.length
                  ? this.state.explorerCollapse
                    ? <span className='repl-output-buffer-explorer-container'>
                        <i className='fa fa-plus-square-o' onClick={this.onToggleExplorerCollapse}></i>
                        <span className='data-explorer-label'>Data Explorer</span>
                      </span>
                    : <span className='repl-output-buffer-explorer-container'>
                        <i className='fa fa-minus-square-o' onClick={this.onToggleExplorerCollapse}></i>
                        <span className='data-explorer-label'>Data Explorer</span>
                        <ReplOutputBufferExplorer buffer={this.props.buffer}/>
                      </span>
                  : null
              }
              </span>
            </span>
        }
      </span>
    );
  }
}

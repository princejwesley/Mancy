import React from 'react';
import _ from 'lodash';
import ReplOutput from '../common/ReplOutput';

export default class ReplOutputFunction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
      funCollapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onToggleFunCollapse = this.onToggleFunCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onToggleFunCollapse() {
    this.setState({
      funCollapse: !this.state.funCollapse
    });
  }

  render() {
    let label = ' function() {}';
    return (
      <span className='repl-entry-message-output-object-folds'>
        {
          this.state.collapse
          ? <span className='repl-entry-message-output-object'>
              <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
              <span className='object-desc'>{label}</span>
            </span>
          : <span className='repl-entry-message-output-object'>
              <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
              <span className='object-desc'>{label}</span>
              <span className='object-rec'>
              {
                _.map(Object.getOwnPropertyNames(this.props.fun), (key) => {
                  let value = this.props.fun[key];
                  let keyClass = this.props.fun.propertyIsEnumerable(key) ? 'object-key' : 'object-key dull';
                  return (
                    <div className='object-entry' key={key}>
                      {
                        <span className={keyClass}>
                          {key}
                          <span className='object-colon'>: </span>
                        </span>
                      }
                      {
                        value && value._isReactElement
                          ? { value }
                          : ReplOutput.transformObject(value)
                      }
                    </div>
                  )
                })
              }
              {
                this.props.expandable
                  ? this.state.funCollapse
                      ? <span className='repl-entry-message-output-function'>
                          <i className='fa fa-plus-square-o' onClick={this.onToggleFunCollapse}></i>
                          <span dangerouslySetInnerHTML={{__html:this.props.short}}></span>
                        </span>
                      : <span className='repl-entry-message-output-function'>
                          <i className='fa fa-minus-square-o' onClick={this.onToggleFunCollapse}></i>
                          <span dangerouslySetInnerHTML={{__html:this.props.html}}></span>
                        </span>
                  : <span className='repl-entry-message-output-function' dangerouslySetInnerHTML={{__html:this.props.html}}>
                    </span>
              }
              </span>
            </span>
        }
      </span>
    );
  }
}

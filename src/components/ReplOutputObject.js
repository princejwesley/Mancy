import React from 'react';
import _ from 'lodash';
import ReplOutput from '../common/ReplOutput';

export default class ReplOutputObject extends React.Component {
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
    let label = ' Object {}';
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
                _.map(Object.getOwnPropertyNames(this.props.object), (key) => {
                  let value = this.props.object[key];
                  let keyClass = this.props.object.propertyIsEnumerable(key) ? 'object-key' : 'object-key dull';
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
                          ? {value}
                          : ReplOutput.transformObject(value)
                      }
                    </div>
                  )
                })
              }
              {
                this.props.primitive
                 ? <div className='object-entry' key='[[PrimitiveValue]]'>
                     {
                       <span className='object-key dull'>
                         [[PrimitiveValue]]
                         <span className='object-colon'>: </span>
                       </span>
                     }
                     { ReplOutput.transformObject(this.props.object.toString()) }
                   </div>
                 : null
              }
              </span>
            </span>
        }
      </span>
    );
  }
}

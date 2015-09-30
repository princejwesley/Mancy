import React from 'react';
import _ from 'lodash';

export default class ReplOutputArray extends React.Component {
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
    $console.log('render', this.props.array)
    return (
      <span className='repl-entry-message-output-array-folds'>
        {
          this.state.collapse
          ? <span className='repl-entry-message-output-array'>
              <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
              <span className='array-desc'>{this.props.label}</span>
            </span>
          : <span className='repl-entry-message-output-array'>
              <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
              <span className='array-desc'>{this.props.label}</span>
              <span className='array-rec'>
              {
                _.map(this.props.array, (e, idx) => {
                  return (
                    <div className='array-entry'>
                      {
                        this.props.noIndex
                          ? null
                          : <span className='array-idx'>
                              {this.props.start + idx}
                              <span className='array-colon'>: </span>
                            </span>
                      }
                      {e}
                    </div>
                  )
                })
              }
              </span>
            </span>
        }
      </span>
    );
  }
}

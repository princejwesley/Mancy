import React from 'react';
import ReplOutputObject from './ReplOutputObject';
import _ from 'lodash';

export default class ReplOutputDate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    };
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  render() {
    return (
      <span className='repl-entry-message-output-object-folds'>
        {
          this.state.collapse
            ? <span className='repl-entry-message-output-object'>
                <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                <i className='fa fa-calendar' title='Date'></i>
                <span className='objec-desc date'>{this.props.date.toString()}</span>
              </span>
            : <span className='repl-entry-message-output-object'>
                <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                <i className='fa fa-calendar' title='Date'></i>
                <span className='object-desc'>{this.props.date.toString()}</span>
                <span className='object-rec'>
                  {
                    this.props.date.__proto__
                    ?  <div className='object-entry' key='prototype'>
                          __proto__
                          <span className='object-colon'>: </span>
                          <ReplOutputObject object={Object.getPrototypeOf(this.props.date)} primitive={false}/>
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

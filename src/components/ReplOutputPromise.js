import React from 'react';
import {EOL} from 'os';
import ReplCommon from '../common/ReplCommon';
import ReplOutput from '../common/ReplOutput';
import ReplConstants from '../constants/ReplConstants';
import ReplOutputObject from './ReplOutputObject';

export default class ReplOutputPromise extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: this.props.initStatus,
      value: this.props.initValue,
      reason: null,
      collapse: true
    };

    this.resolve = this.resolve.bind(this);
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  componentDidMount() {
    this.resolve();
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  resolve() {
    let promise = this.props.promise;
    promise.then((value) => {
      this.setState({
        value: value,
        status: ReplConstants.PROMISE.RESOLVED
      });
    }).catch((reason) => {
      this.setState({
        value: reason,
        status: ReplConstants.PROMISE.REJECTED
      });
    });
  }

  render() {
    let label = 'Promise {}';

    return (
      <span className='repl-entry-message-output-object-folds promise-object'>
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
                <div className='object-entry' key='promise-status'>
                  {
                    <span className='promise-status'>
                      [[PromiseStatus]]
                      <span className='object-colon'>: </span>
                      <span className='string'>{this.state.status}</span>
                    </span>
                  }
                </div>
              }
              {
                <div className='object-entry' key='promise-value'>
                  {
                    <span className='promise-value'>
                      [[PromiseValue]]
                      <span className='object-colon'>: </span>
                    </span>
                  }
                  { ReplOutput.transformObject(this.state.value) }
                </div>
              }
              {
                this.props.promise.__proto__
                ?  <div className='object-entry' key='prototype'>
                      __proto__
                      <span className='object-colon'>: </span>
                      <ReplOutputObject object={Object.getPrototypeOf(this.props.promise)} primitive={false}/>
                  </div>
                : null
              }
            </span>
          </span>
        }
      </span>);
  }
}

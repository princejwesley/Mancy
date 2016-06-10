import React from 'react';
import {EOL} from 'os';
import ReplCommon from '../common/ReplCommon';
import ReplOutput from '../common/ReplOutput';
import ReplConstants from '../constants/ReplConstants';
import ReplOutputObject from './ReplOutputObject';
import _ from 'lodash';
import ReplActions from '../actions/ReplActions';

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
    this.bindObjectToContext = this.bindObjectToContext.bind(this);
  }

  componentDidMount() {
    this.resolve();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
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

  bindObjectToContext() {
    ReplActions.bindObjectToContext(this.props.promise, ReplOutput.transformObject(this.props.promise));
  }

  render() {
    let label = '<span class="cm-variable"> Promise</span> {}';

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
              <i className='fa fa-hashtag' title='Store as Global Variable' onClick={this.bindObjectToContext}></i>
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

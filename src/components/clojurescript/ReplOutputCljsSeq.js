import React from 'react';
import _ from 'lodash';
import ReplOutput from '../../common/ReplOutput';
import ReplOutputObject from '../ReplOutputObject';
import ReplCommon from '../../common/ReplCommon';
import ReplActions from '../../actions/ReplActions';

export default class ReplOutputCljsSeq extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    }

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

  getKeysButLength() {
    let keys = Object.keys(this.props.array);
    return keys.slice(0, keys.length);
  }

  getShortSeq() {
    const arr = this.props.array;
    const element =
      <span className='array-desc'>
        {this.props.token.prefix}
        {this.getSeqRecords(Math.min(arr.length, 5))}
        {
          arr.length > 5
            ? <span className='ellipsis' onClick={this.onToggleCollapse}></span>
            : null
        }
        {this.props.token.suffix}
      </span>

    return {short: arr.length <= 5, element: element};
  }

  getSeqRecords(len = -1) {
    let keys = this.getKeysButLength();
    keys = len !== -1 ? keys.slice(0, len) : keys;
    const clazz = `${len !== -1 ? 'inline' : ''}  array-rec`
    return (
      <span className={clazz}>
      {
        _.map(keys, (key) => {
          let value = ReplOutput.readProperty(this.props.array, key);
          let idx = parseInt(key, 10);
          return (
            <div className='array-entry' key={idx} title={"index: " + (this.props.start + idx)}>
              { value && value._isReactElement ? {value} : ReplOutput.clojure(value).view() }
            </div>
          )
        })
      }
      </span>
    );
  }

  render() {
    const {short, element} = this.getShortSeq();
    const title = this.props.length || "";
    return (
      <span className='repl-entry-message-output-array-folds'>
        {
          short
            ? <span className='repl-entry-message-output-array' title={title}>
                {element}
              </span>
            : this.state.collapse
              ? <span className='repl-entry-message-output-array' title={title}>
                  <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                  {element}
                </span>
              : <span className='repl-entry-message-output-array' title={title}>
                  <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                  {element}
                  {this.getSeqRecords()}
                </span>
        }
      </span>
    );
  }
}

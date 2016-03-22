import React from 'react';
import _ from 'lodash';
import ReplOutput from '../../common/ReplOutput';

export default class ReplOutputCljsMeta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      iCollapse: true,
      collapse: true
    };

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onToggleICollapse = this.onToggleICollapse.bind(this);
    this.getMetaData = this.getMetaData.bind(this);
    this.buildMetaData = this.buildMetaData.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onToggleICollapse() {
    this.setState({
      iCollapse: !this.state.iCollapse
    });
  }

  buildMetaData(arr, result = []) {
    for(let pos = 0; pos + 1 < arr.length; pos += 2) {
      // revisit
      if(!arr[pos] && !arr[pos + 1]) { return result; }
      if(arr[pos] === null) { this.buildMetaData(arr[pos + 1].arr, result); }
      else {
        result.push(
          <div className='meta-record'>
            <span className='meta-key cm-atom'>{arr[pos].toString()}</span>
            <span className='meta-value'>{ReplOutput.clojure(arr[pos + 1]).view()}</span>
          </div>
        );
      }
    }
    return result;
  }

  getMetaData(arr) {
    let metaRecords = this.buildMetaData(arr);
    return (
      <div className="meta-records">
        {_.map(metaRecords, r => r)}
      </div>
    );
  }

  render() {
    const value = this.props.value || {};
    const core = this.props.core;
    const iMeta = value._meta;
    const meta = value.meta;
    return (
      <div className='repl-cljs-meta-fold'>
        {
          iMeta
            ? this.state.iCollapse
              ? <span className='repl-cljs-meta'>
                  <i className='fa fa-plus-square-o' onClick={this.onToggleICollapse}></i>
                  <span className='meta-label cm-keyword'>root</span>
                </span>
              : <span className='repl-cljs-meta'>
                  <i className='fa fa-minus-square-o' onClick={this.onToggleICollapse}></i>
                  <span className='meta-label cm-keyword'>root</span>
                  {this.getMetaData(iMeta.root.arr)}
                </span>
            : null
        }
        {
          meta
            ? this.state.collapse
              ? <span className='repl-cljs-meta'>
                  <i className='fa fa-plus-square-o' onClick={this.onToggleCollapse}></i>
                  <span className='meta-label cm-keyword'>meta</span>
                </span>
              : <span className='repl-cljs-meta'>
                  <i className='fa fa-minus-square-o' onClick={this.onToggleCollapse}></i>
                  <span className='meta-label cm-keyword'>meta</span>
                  {this.getMetaData(meta.arr)}
                </span>
            : null
        }
      </div>
    );
  }
}

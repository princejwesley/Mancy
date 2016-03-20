import React from 'react';
import ReplContext from '../common/ReplContext';
import _ from 'lodash';
import ReplOutput from '../common/ReplOutput';

export default class ReplConsoleEnvironmentWatcher extends React.Component {
  constructor(props) {
    super(props);
    this.context = ReplContext.getContext();
    this.getProperties = this.getProperties.bind(this);
    this.getENV = this.getENV.bind(this);
    this.toggleFunsView = this.toggleFunsView.bind(this);
    this.toggleValuesView = this.toggleValuesView.bind(this);
    this.state = {
      funView: true,
      valueView: true
    };
  }

  getProperties(names) {
    let context = ReplContext.getContext();
    return _.map(names, (key) => {
      let value = ReplOutput.readProperty(context, key);
      let keyClass = context.propertyIsEnumerable(key) ? 'env-key' : 'env-key dull';
      return (
        <div className='env-entry' key={key.toString()}>
          {
            <span className={keyClass}>
              {key.toString()}
            </span>
          }
          <span className='env-value'>
          {
            value && value._isReactElement
              ? {value}
              : ReplOutput.transformObject(value)
          }
          </span>
        </div>
      )
    })
  }

  getENV() {
    let context = ReplContext.getContext();
    let userDefinedNames = _.sortBy(_.difference(Object.getOwnPropertyNames(context), ReplContext.alphaNames));
    return _.partition(userDefinedNames, (name) => typeof context[name] === 'function');
  }

  toggleValuesView() {
    this.setState({
      valueView: !this.state.valueView
    });
  }

  toggleFunsView() {
    this.setState({
      funView: !this.state.funView
    });
  }

  render() {
    let [funs, vals] = this.getENV();
    let valueClass = `repl-console-environment-listing-title fa ${this.state.valueView ? 'fa-minus-square-o': 'fa-plus-square-o'}`;
    let funClass = `repl-console-environment-listing-title fa ${this.state.funView ? 'fa-minus-square-o': 'fa-plus-square-o'}`;
    return (
      <div className='repl-console-environment'>
        <div className='repl-console-environment-head'>
          <span className='repl-console-environment-title flex' title='Watcher for user defined global variables'>
            Global Environment
          </span>
        </div>
        <div className='repl-console-environment-body'>
          <div className='repl-console-environment-body-header'>
            <span className='repl-console-environment-listing-title flex'>Values</span>
            <i className={valueClass} onClick={this.toggleValuesView}></i>
          </div>
          {
            this.state.valueView
              ? vals.length
                ? <div className='repl-console-environment-listing'>
                  {
                    this.getProperties(vals)
                  }
                  </div>
                : <div className='repl-console-environment-no-data'> No values</div>
              : null
          }
          <div className='repl-console-environment-body-header'>
            <span className='repl-console-environment-listing-title flex'>Functions</span>
            <i className={funClass} onClick={this.toggleFunsView}></i>
          </div>
          {
            this.state.funView
              ? funs.length
                ? <div className='repl-console-environment-listing'>
                  {
                    this.getProperties(funs)
                  }
                  </div>
                : <div className='repl-console-environment-no-data'> No functions</div>
              : null
          }
        </div>
      </div>
    );
  }
}

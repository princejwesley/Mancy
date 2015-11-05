import React from 'react';
import _ from 'lodash';
import ReplOutput from '../common/ReplOutput';
import ReplCommon from '../common/ReplCommon';
import ReplOutputObject from './ReplOutputObject';
import ReplOutputChartViewer from './ReplOutputChartViewer';

export default class ReplOutputChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chartCollapse: true,
      collapse: true
    }

    this.getAllProps = this.getAllProps.bind(this);
    this.onToggleChartCollapse = this.onToggleChartCollapse.bind(this);
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onToggleChartCollapse() {
    this.setState({
      chartCollapse: !this.state.chartCollapse
    });
  }

  getType(obj) {
    let type = obj ? ReplCommon.type(obj) : 'Object';
    return ` ${type !== 'Undefined' ? type : 'Object'} {}`;
  }

  getAllProps() {
    let names = Object.getOwnPropertyNames(this.props.chart);
    let symbols = Object.getOwnPropertySymbols(this.props.chart);
    return _.sortBy(names.concat(symbols), (value) => {
      return value.toString();
    });
  }

  render() {
    let label = ReplCommon.highlight(this.getType(this.props.chart));
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
                _.map(this.getAllProps(), (key) => {
                  let value = ReplOutput.readProperty(this.props.chart, key);
                  let keyClass = this.props.chart.propertyIsEnumerable(key) ? 'object-key' : 'object-key dull';
                  return (
                    <div className='object-entry' key={key.toString()}>
                      {
                        <span className={keyClass}>
                          {key.toString()}
                          <span className='object-colon'>: </span>
                        </span>
                      }
                      {
                        ReplOutput.transformObject(value)
                      }
                    </div>
                  )
                })
              }
              {
                this.props.chart.__proto__
                ?  <div className='object-entry' key='prototype'>
                      __proto__
                      <span className='object-colon'>: </span>
                      <ReplOutputObject object={Object.getPrototypeOf(this.props.chart)} primitive={false}/>
                  </div>
                : null
              }
              {
                this.state.chartCollapse
                  ? <span className='repl-output-chart-viewer-container'>
                      <i className='fa fa-plus-square-o' onClick={this.onToggleChartCollapse}></i>
                      <span className='data-explorer-label'>Chart Viewer</span>
                    </span>
                  : <span className='repl-output-chart-viewer-container'>
                      <i className='fa fa-minus-square-o' onClick={this.onToggleChartCollapse}></i>
                      <span className='data-explorer-label'>Chart Viewer</span>
                      <ReplOutputChartViewer chart={this.props.chart}/>
                    </span>
              }
              </span>
            </span>
        }
      </span>
    );
  }
}

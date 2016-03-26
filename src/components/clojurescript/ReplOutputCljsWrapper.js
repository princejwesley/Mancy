import React from 'react';
import ReplOutput from '../../common/ReplOutput';
import ReplCommon from '../../common/ReplCommon';
import ReplOutputCljsMeta from './ReplOutputCljsMeta';
import ReplOutputGridViewer from '../ReplOutputGridViewer'
import ReplOutputChartViewer from '../ReplOutputChartViewer'

export default class ReplOutputCljsWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    };

    if(this.props.value) {
      const value = this.props.value;
      this.hasMeta = value.meta || value._meta;

      this.jsValue = this.props.core.clj__GT_js(value);
      try{ this.hasGrid = ReplCommon.candidateForGrid(this.jsValue); }
      catch(e) { this.hasGrid = false; }
      this.hasChart = ReplCommon.candidateForChart(this.jsValue);
    }
    this.hasExtra = this.hasMeta || this.hasGrid || this.hasChart;
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  getMeta() {
    return ((!this.state.collapse && this.hasMeta)
      ? <ReplOutputCljsMeta value={this.props.value} core={this.props.core} />
    : null);
  }

  getGrid() {
    return ((!this.state.collapse && this.hasGrid)
      ? <div className='repl-cljs-grid-annotate'>
          <ReplOutputGridViewer grid={this.jsValue} gridViewable="true"/>
        </div>
    : null);
  }

  getChart() {
    return ((!this.state.collapse && this.hasChart)
      ? <div className='repl-cljs-chart-annotate'>
          <ReplOutputChartViewer chart={this.jsValue} chartViewable="true"/>
        </div>
    : null);
  }

  render() {
    const clazz = `fa fa-${this.state.collapse ? 'plus' : 'minus'}-square-o`;
    return (
      <span className='repl-cljs-wrapper'>
        {
          this.hasExtra
            ? <span className='repl-cljs-annotate'>
                <i className={clazz} onClick={this.onToggleCollapse}></i>
                {this.props.view}
                {this.getMeta()}
                {this.getGrid()}
                {this.getChart()}
              </span>
            : this.props.view
        }
      </span>
    );
  }
}

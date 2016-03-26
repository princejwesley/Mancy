import React from 'react';
import _ from 'lodash';
import ReplCommon from '../common/ReplCommon';
import ReplOutputHTML from './ReplOutputHTML';
import c3 from 'c3';

export default class ReplOutputChartViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'bar',
      flip: false,
      rotate: false,
      spline: false,
      chartCollapse: true,
    };
    _.each([
      'generateChart', 'generateFlippedData', 'onToggleSpline',
      'onToggleFlip', 'onToggleRotate', 'onClickBarChart',
      'onClickLineChart', 'onClickAreaChart', 'onClickPieChart',
      'isLineChart', 'isAreaChart', 'isSplineChart', 'generateColumnData',
      'onToggleChartCollapse'
    ], (field) => {
      this[field] = this[field].bind(this);
    });
    this.init();
  }

  init() {
    this.chartViewable = this.props.chartViewable || ReplCommon.candidateForChart(this.props.chart);
    if(this.chartViewable) {
      this.id = `chart-${_.uniqueId()}-${Date.now()}`;
      let keys = _.keys(this.props.chart);
      this.columns = this.generateColumnData(this.props.chart);
      this.flippedData = this.generateFlippedData(this.columns);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.chartViewable && !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  componentDidMount() {
  }

  onToggleChartCollapse() {
    this.setState({
      chartCollapse: !this.state.chartCollapse
    });
  }

  generateColumnData(source) {
    let size = _.reduce(source, (o, arr) => {
      return Math.max(o, arr.length);
    }, 0);
    let range = new Array(size).fill(0);
    return _.map(source, (v, k) => ([k].concat(v).concat(range)).slice(0, size + 1));
  }

  generateFlippedData(cols) {
    let categories = _.reduce(cols, (o, col) => o.concat(col[0]), []);

    let range = _.range(cols[0].length - 1);

    let columns = _.reduce(range, (o, r) => {
      let record = _.reduce(cols, (out, col) => {
        out.push(col[r + 1] || 0);
        return out;
      }, [`${r}`]);
      o.push(record);
      return o;
    }, []);

    return { categories: categories, columns: columns };
  }

  generateChart() {
    let obj = {
      bindto: `#${this.id}`,
      data: {
        columns: this.state.flip ? this.flippedData.columns : this.columns
      },
      axis: {
        rotated: this.state.rotate
      },
      zoom: {
        enabled: true
      }
    };

    if(this.state.flip) {
      obj.axis.x = {
        type: 'category',
        categories: this.flippedData.categories
      }
    }
    if(this.state.type) {
      obj.data.type = this.state.type;
    }

    this.chart = c3.generate(obj);
  }

  onToggleSpline(e) {
    this.setState({
      spline: !this.state.spline
    });
    setTimeout(() => {
      if(this.isLineChart()) {
        this.onClickLineChart();
      } else if(this.isAreaChart()) {
        this.onClickAreaChart();
      }
    }, 100);
  }

  onToggleFlip(e) {
    this.setState({
      flip: !this.state.flip
    });
    setTimeout(() => this.generateChart(), 100);
  }

  onToggleRotate(e) {
    this.setState({
      rotate: !this.state.rotate
    });
    setTimeout(() => this.generateChart(), 100);
  }

  onChangeChartType(type) {
    this.setState({
      type: type
    });
    this.chart.transform(type);
  }

  onClickBarChart(e) {
    this.onChangeChartType('bar');
  }

  onClickLineChart(e) {
    let type = this.state.spline ? 'spline' : 'line';
    this.onChangeChartType(type);
  }

  onClickPieChart(e) {
    this.onChangeChartType('pie');
  }

  onClickAreaChart(e) {
    let type = this.state.spline ? 'area-spline' : 'area';
    this.onChangeChartType(type);
  }

  isLineChart() {
    return this.state.type === 'line' || this.state.type === 'spline';
  }

  isAreaChart() {
    return this.state.type === 'area' || this.state.type === 'area-spline';
  }

  isSplineChart() {
    return this.isLineChart() || this.isAreaChart();
  }

  renderChart() {
    let barClazz = `fa fa-bar-chart ${this.state.type === 'bar' ? 'selected' : ''}`;
    let areaClazz = `fa fa-area-chart ${this.isAreaChart() ? 'selected' : ''}`;
    let lineClazz = `fa fa-line-chart ${this.isLineChart() ? 'selected' : ''}`;
    let pieClazz = `fa fa-pie-chart ${this.state.type === 'pie' ? 'selected' : ''}`;

    // render graph
    setTimeout(() => this.generateChart(), 100);

    return (
      <span className='repl-output-data-chart-viewer'>
        <span id={this.id} className='chart-viewer'>
        </span>
        <span className='chart-viewer-preferences'>
          <span className='placeholder'></span>
          <i className={barClazz} title="Bar Chart" onClick={this.onClickBarChart}></i>
          <i className={lineClazz} title="Line Chart" onClick={this.onClickLineChart}></i>
          <i className={pieClazz} title="Pie Chart" onClick={this.onClickPieChart}></i>
          <i className={areaClazz} title="Area Chart" onClick={this.onClickAreaChart}></i>
          <span className="checkbox-group">
            <input type="checkbox" name="flip"
              title='flip category and data'
              checked={this.state.flip} value="" onClick={this.onToggleFlip} />
            flip
          </span>
          <span className="checkbox-group">
            <input type="checkbox"
              title='rotate category and data'
              name="rotate" checked={this.state.rotate} value="" onClick={this.onToggleRotate} />
            rotate
          </span>
          <span className="checkbox-group">
            <input type="checkbox"
              title='spline curve'
              name="spline" disabled={!this.isSplineChart()} checked={this.state.spline} value="" onClick={this.onToggleSpline} />
            spline
          </span>
          <span className='placeholder'></span>
        </span>
      </span>
    );
  }

  render() {
    if(!this.chartViewable) { return null; }
    return (
      this.state.chartCollapse
        ? <span className='repl-output-chart-viewer-container'>
            <i className='fa fa-plus-square-o' onClick={this.onToggleChartCollapse}></i>
            <span className='data-explorer-label'>Chart Viewer</span>
          </span>
        : <span className='repl-output-chart-viewer-container'>
            <i className='fa fa-minus-square-o' onClick={this.onToggleChartCollapse}></i>
            <span className='data-explorer-label'>Chart Viewer</span>
            {this.renderChart()}
          </span>
    );
  }
}

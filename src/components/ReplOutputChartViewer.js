import React from 'react';
import _ from 'lodash';
import ReplCommon from '../common/ReplCommon';
import ReplOutputHTML from './ReplOutputHTML';
import c3 from 'c3';

export default class ReplOutputChartViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: '',
      flip: false,
      rotate: false
    };
    _.each([
      'generateChart', 'generateFlippedData',
      'onToggleFlip', 'onToggleRotate', 'onClickBarChart',
      'onClickLineChart', 'onClickAreaChart', 'onClickPieChart'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.id = `chart-${_.uniqueId()}-${Date.now()}`;
    let keys = _.keys(this.props.chart);
    this.columns = _.map(this.props.chart, (v, k) => [k].concat(v));
    this.flippedData = this.generateFlippedData(this.columns);
  }

  componentDidMount() {
    this.generateChart();
  }

  generateFlippedData(cols) {
    let {size, categories} = _.reduce(cols, (o, col) => { return {
      size: Math.max(o.size, col.length - 1),
      categories: o.categories.concat(col[0])
    }}, { size: 0, categories: [] });

    let range = _.range(size);

    let columns = _.reduce(range, (o, r) => {
      let record = _.reduce(cols, (out, col) => {
        out.push(col[r + 1])
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

    c3.generate(obj);
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
    setTimeout(() => this.generateChart(), 100);
  }

  onClickBarChart(e) {
    this.onChangeChartType('bar');
  }

  onClickLineChart(e) {
    this.onChangeChartType('');
  }

  onClickPieChart(e) {
    this.onChangeChartType('pie');
  }

  onClickAreaChart(e) {
    this.onChangeChartType('area-spline');
  }

  render() {
    let barClazz = `fa fa-bar-chart ${this.state.type === 'bar' ? 'selected' : ''}`;
    let areaClazz = `fa fa-area-chart ${this.state.type === 'area-spline' ? 'selected' : ''}`;
    let lineClazz = `fa fa-line-chart ${this.state.type === '' ? 'selected' : ''}`;
    let pieClazz = `fa fa-pie-chart ${this.state.type === 'pie' ? 'selected' : ''}`;

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
            Flip
          </span>
          <span className="checkbox-group">
            <input type="checkbox"
              title='rotate category and data'
              name="rotate" checked={this.state.rotate} value="" onClick={this.onToggleRotate} />
            Rotate
          </span>
          <span className='placeholder'></span>
        </span>
      </span>
    );
  }
}

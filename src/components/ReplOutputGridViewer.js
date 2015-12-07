import React from 'react';
import _ from 'lodash';
import ReplOutput from '../common/ReplOutput';
import ReplCommon from '../common/ReplCommon';

export default class ReplOutputGridViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
      transpose: false
    }

    this.gridViewable = false;
    try{ this.gridViewable = ReplCommon.candidateForGrid(this.props.grid); }
    catch(e) {}

    _.each([
      'onToggleCollapse', 'onToggleTranspose', 'renderGrid', 'transposeGridData',
      'gridData', 'getCellString'
    ], (field) => {
      this[field] = this[field].bind(this);
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.gridViewable && !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onToggleTranspose() {
    this.setState({
      transpose: !this.state.transpose
    });
  }

  getCellString(cell) {
    return _.isDate(cell) ? cell.toDateString().substring(4) : cell.toString();
  }

  transposeGridData() {
    let toTranspose = () => {
      let gridValues = this.gridData();
      let data = _.reduce(gridValues, (o, row) => {
        _.each(row, (r, pos) => {
          o[pos] || o.push([]);
          o[pos].push(r);
        });
        return o;
      }, []);
      return (this.transposedGridData = data);
    };
    return this.transposedGridData || toTranspose();
  }

  gridData() {
    let grid = this.props.grid;
    return this.gridValues || (this.gridValues = _.map(_.keys(grid), (key) => _.values(grid[key])));
  }

  renderGrid() {
    let grid = this.props.grid;
    this.colHeaders = this.colHeaders || _.keys(grid);
    this.rowHeaders = this.rowHeaders || _.keys(grid[this.colHeaders[0]]);

    let [rowHeaders, colHeaders] = this.state.transpose
      ? [this.colHeaders, this.rowHeaders] : [this.rowHeaders, this.colHeaders];

    let data = this.state.transpose ? this.transposeGridData() : this.gridData();
    return (
      <div className='repl-output-grid-viewer'>
        <table className='grid-viewer'>
          <caption className='grid-caption'>
            <input type='checkbox'
              className='grid-transpose'
              onClick={this.onToggleTranspose}
              value=''
              checked={this.state.transpose}/> Transpose Grid
          </caption>
          <thead className='grid-head'>
            <tr>
              {<th></th>}
              {
                _.map(rowHeaders, (head) => {
                  return <th>{head}</th>
                })
              }
            </tr>
          </thead>
          <tbody className='grid-body'>
            {
              _.map(colHeaders, (head, pos) => {
                return (
                  <tr>
                    {<th>{head}</th>}
                    {
                      _.map(data[pos], (cell) => {
                        return <td className={typeof cell}>{this.getCellString(cell)}</td>
                      })
                    }
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    if(!this.gridViewable) { return null; }
    return (
      <span className='repl-entry-message-output-object-folds'>
      {
        this.state.collapse
          ? <span className='repl-output-grid-viewer-container'>
              <i className='fa fa-plus-square-o' onClick={this.onToggleCollapse}></i>
              <span className='data-explorer-label'>Grid Viewer</span>
            </span>
          : <span className='repl-output-grid-viewer-container'>
              <i className='fa fa-minus-square-o' onClick={this.onToggleCollapse}></i>
              <span className='data-explorer-label'>Grid Viewer</span>
              {this.renderGrid()}
            </span>
      }
      </span>
    );
  }
}

import React from 'react';
import _ from 'lodash';

const mode = {
  'bin' : 2,
  'oct' : 8,
  'dec' : 10,
  'hex' : 16
};

export default class ReplOutputInteger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'dec'
    };

    _.each([
      'setMode', 'toIntString', 'getClazz'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    _.each(_.keys(mode), (m) => {
      let n = `on${_.capitalize(m)}Mode`;
      this[n] = () => this.setMode(m);
      this[n].bind(this);
    });
  }

  setMode(mode) {
    this.setState({
      mode: mode
    });
  }

  toIntString(n) {
    return (n >>> 0).toString(mode[this.state.mode]);
  }

  getClazz(m) {
    return `mode ${this.state.mode === m ? 'selected' : ''}`;
  }

  render() {
    return (
      <span className='repl-integer'>
        <span className='number'>{this.toIntString(this.props.int)}</span>
        <span className="mode-group">
          <span className={this.getClazz('bin')} title='binary' onClick={this.onBinMode}>b</span>
          <span className={this.getClazz('oct')} title='octal' onClick={this.onOctMode}>o</span>
          <span className={this.getClazz('dec')} title='decimal' onClick={this.onDecMode}>d</span>
          <span className={this.getClazz('hex')} title='hexa decimal' onClick={this.onHexMode}>x</span>
        </span>
      </span>
    );
  }
}

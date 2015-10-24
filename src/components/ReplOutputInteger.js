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
      mode: 'dec',
      type: 'signed'
    };

    _.each([
      'setMode', 'toIntString', 'getClazz', 'getTypedClazz', 'onSignedMode', 'onUnsignedMode'
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

  onSignedMode() {
    this.setState({
      type: 'signed'
    })
  }

  onUnsignedMode() {
    this.setState({
      type: 'unsigned'
    })
  }

  toIntString(n) {
    let num = this.state.type === 'signed' ? n : (n >>> 0);
    return (num).toString(mode[this.state.mode]);
  }

  getClazz(m) {
    return `mode ${this.state.mode === m ? 'selected' : ''}`;
  }

  getTypedClazz(m) {
    return `mode ${this.state.type === m ? 'selected' : ''}`;
  }

  render() {
    return (
      <span className='repl-integer'>
        <span className='number'>{this.toIntString(this.props.int)}</span>
        <span className="mode-group">
          <span className={this.getClazz('bin')} data-token='m' title='binary' onClick={this.onBinMode}>b</span>
          <span className={this.getClazz('oct')} data-token='o' title='octal' onClick={this.onOctMode}>o</span>
          <span className={this.getClazz('dec')} data-token='d' title='decimal' onClick={this.onDecMode}>d</span>
          <span className={this.getClazz('hex')} data-token='e' title='hexa decimal' onClick={this.onHexMode}>x</span>
        </span>
        <span className="mode-group">
          <span className={this.getTypedClazz('signed')} data-token='-' title='signed' onClick={this.onSignedMode}>s</span>
          <span className={this.getTypedClazz('unsigned')} data-token='+' title='unsigned' onClick={this.onUnsignedMode}>u</span>
        </span>
      </span>
    );
  }
}

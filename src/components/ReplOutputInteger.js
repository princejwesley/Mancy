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
      type: 'signed',
      collapse: 'true'
    };

    _.each([
      'setMode', 'toIntString', 'getClazz', 'getTypedClazz', 'onSignedMode', 'onUnsignedMode', 'onToggleCollapse'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    _.each(_.keys(mode), (m) => {
      let n = `on${_.capitalize(m)}Mode`;
      this[n] = () => this.setMode(m);
      this[n].bind(this);
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  setMode(mode) {
    this.setState({
      mode: mode
    });
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse,
      mode: 'dec',
      type: 'signed'
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

  isOutOfRange() {
    return this.props.int > -1 && this.props.int < 2;
  }

  hide() {
    return this.state.collapse || this.isOutOfRange();
  }

  render() {
    let hide = this.hide();
    let outOfRange = this.isOutOfRange();
    let clazz = `mode-group ${ hide ? 'hide' : 'show'}`;
    let tips = outOfRange ? '' : 'Click to Toggle Base/Sign Converter';
    let numClazz = `cm-number ${outOfRange ? '' : 'toggle-number'}`;
    return (
      <span className='repl-integer'>
        <span className={numClazz} title={tips} onClick={this.onToggleCollapse}>{this.toIntString(this.props.int)}</span>
        <span className={clazz}>
          <span className={this.getClazz('bin')} data-token='m' title='binary' onClick={this.onBinMode}>b</span>
          <span className={this.getClazz('oct')} data-token='o' title='octal' onClick={this.onOctMode}>o</span>
          <span className={this.getClazz('dec')} data-token='d' title='decimal' onClick={this.onDecMode}>d</span>
          <span className={this.getClazz('hex')} data-token='e' title='hexa decimal' onClick={this.onHexMode}>x</span>
        </span>
        <span className={clazz}>
          <span className={this.getTypedClazz('signed')} data-token='-' title='signed' onClick={this.onSignedMode}>s</span>
          <span className={this.getTypedClazz('unsigned')} data-token='+' title='unsigned' onClick={this.onUnsignedMode}>u</span>
        </span>
      </span>
    );
  }
}

import React from 'react';
import ReplCommon from '../common/ReplCommon';
import _ from 'lodash';

export default class ReplOutputCrypto extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lock: true
    };
    this.toggleLock = this.toggleLock.bind(this);
    this.encodeId = _.uniqueId('crpto-');
    this.decodeId = _.uniqueId('crpto-');
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  toggleLock() {
    this.setState({
      lock: !this.state.lock
    });
  }
  render() {
    let data = this.state.lock ? this.props.encode : this.props.decode;
    let clazz = `fa ${this.state.lock ? 'fa-lock' : 'fa-unlock'}`;
    let cryptoClazz = `repl-output-crypto ${this.state.lock && Buffer.isBuffer(this.props.decode) ? 'extend' : ''}`;
    let key = `${this.state.lock ? this.encodeId : this.decodeId}-key`;
    return (
      <span className={cryptoClazz} key={key}>
      {
        <span className='repl-crypto-data' title={this.props.type}>
          {data}
          <i className={clazz} onClick={this.toggleLock}></i>
        </span>
      }
    </span>
    );
  }
}

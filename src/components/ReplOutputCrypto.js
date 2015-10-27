import React from 'react';
import ReplCommon from '../common/ReplCommon';

export default class ReplOutputCrypto extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lock: true
    };
    this.toggleLock = this.toggleLock.bind(this);
  }
  toggleLock() {
    this.setState({
      lock: !this.state.lock
    });
  }
  render() {
    let data = this.state.lock ? this.props.encode : this.props.decode;
    let clazz = `fa ${this.state.lock ? 'fa-lock' : 'fa-unlock'}`;
    return (
      <span className='repl-output-crypto'>
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

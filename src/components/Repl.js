import React from 'react';
import _ from 'lodash';
import ReplEntries from './ReplEntries';
import ReplPrompt from './ReplPrompt';
import ReplStatus from './ReplStatus';
import ReplStore from '../stores/ReplStore';
import Reflux from 'reflux';

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: []
    };
    this.onStateChange = this.onStateChange.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = ReplStore.listen(this.onStateChange);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onStateChange(item) {
    this.setState({
      entries: ReplStore.getEntries()
    });
  }

  render() {
    return (
      <div className='repl-container'>
        <ReplEntries entries={this.state.entries} />
        <ReplPrompt key={document.body.scrollHeight}/>
        <div className="repl-status-bar-cover"> </div>
        <ReplStatus />
      </div>
    );
  }
}

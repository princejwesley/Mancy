import React from 'react';
import _ from 'lodash';
import ReplEntries from './ReplEntries';
import ReplPrompt from './ReplPrompt';
import ReplStore from '../stores/ReplStore';
import Reflux from 'reflux';

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: []
    };
  }

  componentDidMount() {
    this.unsubscribe = ReplStore.listen(this.onStateChange);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onStateChange(item) {
    console.log(item, 'item received @ repl')
  }

  render() {
    return (
      <div className='repl-container'>
        <ReplEntries entries="{this.state.entries}" />
        <ReplPrompt />
      </div>
    );
  }
}

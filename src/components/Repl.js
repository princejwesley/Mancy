import React from 'react';
import _ from 'lodash';
import ReplEntry from './ReplEntry';
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
      <div className='repl-entries'>
        {
          _.map(this.state.entries, (entry) => {
            return <ReplEntry item='{entry}' />;
          })
        }
        <ReplPrompt />
      </div>
    );
  }
}

Repl.propTypes = {
  token: React.PropTypes.number.isRequired,
}

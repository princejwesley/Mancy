import React from 'react';
import _ from 'lodash';
import ReplConsoleStore from '../stores/ReplConsoleStore';

export default class ReplConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = ReplConsoleStore.getStore();

    this.onConsoleChange = this.onConsoleChange.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = ReplConsoleStore.listen(this.onConsoleChange);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onConsoleChange() {
    this.setState(ReplConsoleStore.getStore());
  }

  render() {
    return (
      <div className='repl-console-message'>
        {
          _.map(this.state.entries, ({type, data}) => {
            return (
              <div className='repl-console-message-entry'>
                {ReplConsole.getTypeIcon[type]}
                {data}
              </div>
            );
          })
        }
      </div>
    );
  }

  static getTypeIcon = (() => {
    let cache = {};
    cache.error = <i className="fa fa-exclamation-circle repl-console-message-error"></i>
    cache.warn = <i className="fa fa-exclamation-triangle repl-console-message-warning"></i>
    cache.info = <i className="fa fa-info-circle repl-console-message-info"></i>
    return cache;
  })();

}

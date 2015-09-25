import React from 'react';
import _ from 'lodash';
import ReplConsoleStore from '../stores/ReplConsoleStore';
import ReplDOM from '../common/ReplDOM';

export default class ReplConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = ReplConsoleStore.getStore();

    this.onConsoleChange = this.onConsoleChange.bind(this);
    this.getTypedClassName = this.getTypedClassName.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = ReplConsoleStore.listen(this.onConsoleChange);
    this.element = React.findDOMNode(this);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onConsoleChange() {
    this.setState(ReplConsoleStore.getStore());
  }

  getTypedClassName(className, type) {
    return className + ' ' + type;
  }

  render() {
    //scroll to bottom
    ReplDOM.scrollToEnd(this.element);
    return (
      <div className='repl-console-message'>
        <div className='repl-console-message-filters'>
          
        </div>
        {
          _.map(this.state.entries, ({type, data}) => {
            return (
              <div className={this.getTypedClassName('repl-console-message-entry', type)}>
                {ReplConsole.getTypeIcon[type]}
                <span className={this.getTypedClassName('repl-console-message-entry-content', type)}> {data.toString()} </span>
              </div>
            );
          })
        }
        <div className="repl-status-bar-cover" key='cover'></div>
      </div>
    );
  }

  static getTypeIcon = (() => {
    let cache = {};
    cache.error = <i className="fa fa-exclamation-circle repl-console-message-error" title='error'></i>
    cache.warn = <i className="fa fa-exclamation-triangle repl-console-message-warning" title='warning'></i>
    cache.info = <i className="fa fa-info-circle repl-console-message-info" title='info'></i>
    return cache;
  })();

}

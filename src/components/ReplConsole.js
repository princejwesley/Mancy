import React from 'react';
import _ from 'lodash';
import ReplConsoleStore from '../stores/ReplConsoleStore';
import ReplDOM from '../common/ReplDOM';
import ReplConsoleMessageFilters from './ReplConsoleMessageFilters';
import ReplConsoleEnvironmentWatcher from './ReplConsoleEnvironmentWatcher';
import ReplConsoleHook from '../common/ReplConsoleHook';

export default class ReplConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.extend({}, ReplConsoleStore.getStore(), {
      debug: true,
      log: true,
      info: true,
      warn: true,
      error: true,
      all: true
    });

    _.each([
      'onConsoleChange', 'getTypedClassName',
      'onAll', 'onFilter', 'onClear', 'getDupCountStyle',
      'getDupTooltip', 'onDrag'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    _.each(['debug', 'log', 'info', 'warn', 'error'], (msg) => {
      let key = 'on' + _.capitalize(msg);
      this[key] = () => this.onFilter(msg);
      this[key] = this[key].bind(this);
    });
  }

  componentDidMount() {
    this.unsubscribe = ReplConsoleStore.listen(this.onConsoleChange);
    this.element = React.findDOMNode(this);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onFilter(type) {
    let flag = !this.state[type];
    let newState = _.extend({}, this.state);
    newState[type] = flag;
    newState.entries = _.filter(ReplConsoleStore.getStore().entries, (entry) => {
      return newState[entry.type];
    });
    this.setState(newState);
  }

  onClear() {
    ReplConsoleStore.clear();
  }

  onAll() {
    let newState;
    if(!this.state.all) {
      newState = _.extend({}, ReplConsoleStore.getStore(), {
        debug: true,
        log: true,
        info: true,
        warn: true,
        error: true,
        all: true
      });
    } else {
      newState = { all: false }
    }
    this.setState(newState);
  }

  onConsoleChange() {
    this.setState(ReplConsoleStore.getStore());
  }

  getTypedClassName(className, type) {
    return className + ' ' + type;
  }

  getDupCountStyle(count) {
    let widthLength = `${count}`.length;
    return { width: `${widthLength + 0.2}em` };
  }

  getDupTooltip(count, type) {
    return `${count} ${type} messages`;
  }

  onDrag(e) {
    let replConsole = document.getElementsByClassName('repl-console')[0];
    let replConsoleEnv = document.getElementsByClassName('repl-console-environment')[0];

    let {clientY} = e;
    let {height} = document.defaultView.getComputedStyle(replConsoleEnv);
    let initHeight = parseInt(height, 10);

    let startDrag = (e) => {
      let adj = e.clientY - clientY;
      replConsoleEnv.style.flex = `0 0  ${(initHeight - adj)}px`;
    }

    let stopDrag = (e) => {
      document.documentElement.removeEventListener('mousemove', startDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }

    document.documentElement.addEventListener('mousemove', startDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }

  render() {
    //scroll to bottom
    ReplDOM.scrollToEnd(this.element);
    return (
      <div className='repl-console-message'>
        <ReplConsoleMessageFilters
          filter={this.state}
          onAll={this.onAll}
          onError={this.onError}
          onWarn={this.onWarn}
          onInfo={this.onInfo}
          onLog={this.onLog}
          onClear={this.onClear}
          onDebug={this.onDebug}/>
        <div className='repl-console-message-list'>
        {
          _.map(this.state.entries, ({type, data, time, count}) => {
            return (
              <div className={this.getTypedClassName('repl-console-message-entry', type)} key={time}>
                {count > 1 ? <span className='console-message-count' title={this.getDupTooltip(count, type)} style={this.getDupCountStyle(count)}>{count}</span>: null}
                {ReplConsole.getTypeIcon[type]}
                <span className={this.getTypedClassName('repl-console-message-entry-content', type)}>
                  {data}
                </span>
              </div>
            );
          })
        }
        </div>
        <div className="repl-console-environment-resizeable" onMouseDown={this.onDrag}>
          <span className='repl-console-drag-lines'> </span>
        </div>
        <ReplConsoleEnvironmentWatcher />
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

import React from 'react';

export default class ReplConsoleMessageFilters extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div className='repl-console-message-filters' key='filters'>
        <span style={{flex:1}}> </span>
        <span className='message-filter' title='All'>
          <input type='checkbox' name='filters' value='All'
            checked={this.props.filter.all}
            onChange={this.props.onAll}>
          </input>
          <span className='label'> A </span>
        </span>
        <span className='message-filter' title='Error'>
          <input type='checkbox' name='filters' value='Error'
            checked={this.props.filter.error}
            disabled={this.props.filter.all}
            onChange={this.props.onError}>
          </input>
          <span className='label'> E </span>
        </span>
        <span className='message-filter' title='Warning'>
          <input type='checkbox' name='filters' value='Warning'
            checked={this.props.filter.warn}
            disabled={this.props.filter.all}
            onChange={this.props.onWarn}>
          </input>
          <span className='label'> W </span>
        </span>
        <span className='message-filter' title='Info'>
          <input type='checkbox' name='filters' value='Info'
            checked={this.props.filter.info}
            disabled={this.props.filter.all}
            onChange={this.props.onInfo}>
          </input>
          <span className='label'> I </span>
        </span>
        <span className='message-filter' title='Log'>
          <input type='checkbox' name='filters' value='Log'
            checked={this.props.filter.log}
            disabled={this.props.filter.all}
            onChange={this.props.onLog}>
          </input>
          <span className='label'> L </span>
        </span>
        <span className='message-filter' title='Debug'>
          <input type='checkbox' name='filters' value='Debug'
            checked={this.props.filter.debug}
            disabled={this.props.filter.all}
            onChange={this.props.onDebug}>
          </input>
          <span className='label'> D </span>
        </span>
        <span style={{flex:1}}> </span>
      </div>
    );
  }
}

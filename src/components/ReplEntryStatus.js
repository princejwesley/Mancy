import React from 'react';

export default class ReplEntryStatus extends React.Component {
  constructor(props) {
    super(props);
    this.repeat = this.repeat.bind(this);
  }
  repeat() {

  }
  render() {
    return (
      <div className='repl-entry-status'>
        { this.props.message.status ? null : <i className="fa fa-exclamation-triangle error" onClick={this.props.onExpand}></i> }
        { this.props.collapse ? <i className="fa fa-plus-circle plus" onClick={this.props.onExpand}></i>
      :  <i className="fa fa-minus-circle minus" onClick={this.props.onCollapse}></i> }
        <i className="fa fa-repeat repeat" onClick={this.repeat}></i>
      </div>
    );
  }
}

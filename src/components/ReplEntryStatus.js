import React from 'react';

export default class ReplEntryStatus extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-entry-status'>
        {
          this.props.message.status
            ? null
            : <i className="fa fa-exclamation-triangle error" title='error'
                onClick={this.props.onExpand}></i>
        }
        {
          this.props.collapse
            ? <i className="fa fa-plus-circle plus" title='maximize'
                onClick={this.props.onExpand}></i>
              : <i className="fa fa-minus-circle minus" title='minimize' onClick={this.props.onCollapse}></i>
        }
        <i className="fa fa-repeat repeat" title='reload' onClick={this.props.onReload}></i>
      </div>
    );
  }
}

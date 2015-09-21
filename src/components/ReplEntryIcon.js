import React from 'react';

export default class ReplEntryIcon extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='repl-entry-icon'>
        {
          this.props.collapse
            ? <i className="fa fa-angle-left" title="expand command" onClick={this.props.onCollapse}></i>
          : <i className="fa fa-angle-down" title="collapse command" onClick={this.props.onCollapse}></i>
        }
      </div>
    );
  }
}

import React from 'react';

export default class ReplOutputFunction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  render() {
    return (
        this.props.expandable
          ? this.state.collapse
              ? <span className='repl-entry-message-output-function'>
                  <i className='fa fa-plus-square-o' onClick={this.onToggleCollapse}></i>
                  <span dangerouslySetInnerHTML={{__html:this.props.short}}></span>
                </span>
              : <span className='repl-entry-message-output-function'>
                  <i className='fa fa-minus-square-o' onClick={this.onToggleCollapse}></i>
                  <span dangerouslySetInnerHTML={{__html:this.props.html}}></span>
                </span>
          : <span className='repl-entry-message-output-function' dangerouslySetInnerHTML={{__html:this.props.html}}>
            </span>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import repl from 'repl';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    console.log(repl, require('fs'))
    const node = React.findDOMNode(this);
    // set focus
    node.focus();
    // set cursor position
    const selection = window.getSelection();
    selection.collapse(node, 0);
  }
  onKeyDown(e) {
    console.log(e)
    // e.preventDefault();
  }
  render() {
    return (
      <div autoFocus className='repl-active-input' contentEditable={true} onKeyDown={this.onKeyDown}>
      </div>
    );
  }

}

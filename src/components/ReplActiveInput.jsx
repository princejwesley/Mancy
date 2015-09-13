import React from 'react';
import _ from 'lodash';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    const node = React.findDOMNode(this);
    // set focus
    node.focus();
    // set cursor position
    const selection = window.getSelection();
    selection.collapse(node, 0);
  }
  render() {
    return (
      <div autoFocus className='repl-active-input' contentEditable={true}>
      </div>
    );
  }
}

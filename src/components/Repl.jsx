import React from 'react';

export default class Repl extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <div id={this.props.id}></div>;
  }
}

import React from 'react';

export default class ReplOutputReactElement extends React.Component {
  componentDidMount() {
      const iframe = this.refs.iframe.getDOMNode();
      const iframeBody = iframe.contentDocument.body;
      React.render(this.props.element, iframeBody);

      // first it's set to zero on purpose
      // check: http://stackoverflow.com/a/20722176/4804689
      iframe.height = 0;

      // actually adjust height
      iframe.height = iframeBody.scrollHeight + 'px';
  }

  render() {
    return (
        <iframe
          style={{border: 'none'}}
          ref="iframe">
        </iframe>
    );
  }
}

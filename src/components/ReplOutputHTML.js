import React from 'react';
import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplOutputString from './ReplOutputString';
import md5 from 'md5';

export default class ReplOutputHTML extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      html: false
    };
    this.onToggleHTMLView = this.onToggleHTMLView.bind(this);
    this.onLoadIFrame = this.onLoadIFrame.bind(this);
    this.id = md5(this.props.source.slice(0,40) + `-${Date.now()}`);
  }

  componentDidMount() {
    this.element = React.findDOMNode(this);
  }

  onToggleHTMLView() {
    this.setState({
      html: !this.state.html
    });
  }

  onLoadIFrame() {
    let iframe = document.getElementById(this.id);
    let doc = iframe.contentDocument;
    doc.body = this.props.body;
    let styles = window.getComputedStyle(doc.body);
    let height = parseInt(styles.height) + parseInt(styles.marginTop) + parseInt(styles.marginBottom);
    // fix max height
    iframe.height = Math.min(height, ReplConstants.IFRAME_MAX_HEIGHT) + 'px';
    doc.body.style.color = (document.body.className === 'dark-theme' ? 'whitesmoke' : 'black');
  }

  render() {
    let clazz = `fa fa-html5 ${this.state.html ? 'html' : 'nohtml'}`;
    let limit = ReplConstants.OUTPUT_TRUNCATE_LENGTH / 2;
    return (
      <span className='repl-html-fold'>
        <ReplOutputString str={this.props.source} limit={limit}/>
        <i className={clazz} onClick={this.onToggleHTMLView}></i>
        {
          this.state.html
            ? <iframe className='sandbox-view' id={this.id} sandbox='allow-forms allow-scripts'
                onLoad={this.onLoadIFrame} srcDoc=''>
              </iframe>
            : null
        }
      </span>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import ReplDOM from '../common/ReplDOM';
import ReplDOMEvents from '../common/ReplDOMEvents';

export default class ReplOutputRegex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
      input: ''
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onHighlight = this.onHighlight.bind(this);
  }

  componentDidMount() {
    this.element = React.findDOMNode(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onHighlight() {
    let re = this.props.regex;
    let replacer = (match) => {
      return match.length ? `<span class='matched'>${match}</span>` : '<span></span>';
    };
    return this.state.input.replace(re, replacer);
  }

  onKeyUp(e) {
    if(e.shiftKey) { return; }
    let playGround = this.element.querySelector('.repl-regex-play-ground');
    this.state.input = playGround.innerText;
    let cursor = ReplDOM.getCursorPositionRelativeTo(playGround);
    let output = this.onHighlight();
    playGround.innerHTML = output;
    ReplDOM.setCursorPositionRelativeTo(cursor, playGround);
  }

  render() {
    return (
      <span className='repl-regex-fold'>
        {
          this.state.collapse
            ? <span className='repl-regex'>
                <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                <span className='regexp'>{this.props.regex.toString()}</span>
              </span>
            : <span className='repl-regex'>
                <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                <span className='regexp'>{this.props.regex.toString()}</span>
                {
                  <div className='repl-regex-play-ground' placeholder='Test regex here'
                    onKeyUp={this.onKeyUp}
                    tabIndex="-1" contentEditable={true}
                    dangerouslySetInnerHTML={{__html:this.onHighlight()}}>
                  </div>
                }
              </span>
        }
      </span>
    );
  }
}

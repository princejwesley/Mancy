import React from 'react';
import _ from 'lodash';
import ReplOutput from '../../common/ReplOutput';

export default class ReplOutputCljsVar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    };

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  getValue() {
    try {
      return this.props.value.val();
    } catch(e) {
      // revist: something went wrong!
      return e.message;
    }
  }

  render() {
    return (
      <span className='repl-cljs-var-fold'>
        {
          this.state.collapse
            ? <span className='repl-cljs-var'>
                <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                <span className='cm-variable'>#</span>
                <span className='cm-atom'>'</span>
                <span className='cm-variable'>{this.props.value.sym.str}</span>
              </span>
            : <span className='repl-cljs-var'>
                <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                <span className='cm-variable'>#</span>
                <span className='cm-atom'>'</span>
                <span className='cm-variable'>{this.props.value.sym.str}</span>
                <div className='repl-cljs-meta-fold'>
                  {ReplOutput.clojure(this.getValue()).view()}
                </div>
              </span>
        }
      </span>
    );
  }
}

import React from 'react';
import ReplOutputCljsMeta from './ReplOutputCljsMeta';
import _ from 'lodash';
import ReplOutput from '../../common/ReplOutput';

export default class ReplOutputCljsVar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
      vCollapse: false
    };

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onToggleVCollapse = this.onToggleVCollapse.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onToggleVCollapse() {
    this.setState({
      vCollapse: !this.state.vCollapse
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
                <ReplOutputCljsMeta value={this.props.value} core={this.props.core} />
                <div className='repl-cljs-meta-fold'>
                {
                  this.state.vCollapse
                    ? <span className='repl-cljs-meta'>
                        <i className='fa fa-plus-square-o' onClick={this.onToggleVCollapse}></i>
                        <span className='meta-label cm-keyword'>value</span>
                      </span>
                    : <span className='repl-cljs-meta'>
                        <i className='fa fa-minus-square-o' onClick={this.onToggleVCollapse}></i>
                        <span className='meta-label cm-keyword'>value</span>
                        <div className='meta-records'>
                          <span className='meta-key'>{ReplOutput.clojure(this.getValue()).view()}</span>
                        </div>
                      </span>
                }
                </div>
              </span>
        }
      </span>
    );
  }
}

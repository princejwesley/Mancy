import React from 'react';
import _ from 'lodash';

export default class ReplOutputCljsDoc extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: !!this.props.open,
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

  render() {
    let clazz = this.state.collapse ? 'fa fa-minus-square-o' : 'fa fa-plus-square-o';
    return (
      <div className='repl-cljs-doc'>
        {
          <span className='repl-cljs-doc-list'>
            <i className={clazz} onClick={this.onToggleCollapse}></i>
            <span className='doc-header'>{this.props.name}</span>
            {
              this.state.collapse
                ? <div className='doc-body'>
                    <span className='doc-definition' dangerouslySetInnerHTML={{__html:this.props.definition}}></span>
                    <div className='doc-description'>
                      {this.props.description}
                    </div>
                  </div>
                : null
            }
          </span>
        }
      </div>
    );
  }
}

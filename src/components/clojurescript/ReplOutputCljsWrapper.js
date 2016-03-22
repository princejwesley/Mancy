import React from 'react';
import ReplOutput from '../../common/ReplOutput';
import ReplOutputCljsMeta from './ReplOutputCljsMeta';

export default class ReplOutputCljsWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    };

    if(this.props.value) {
      const value = this.props.value;
      this.hasMeta = value.meta || value._meta;
      //todo
      this.hasGrid = false;
      this.hasChart = false;
    }
    this.hasExtra = this.hasMeta || this.hasGrid || this.hasChart;
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  getMeta() {
    return ((!this.state.collapse && this.hasMeta)
      ? <ReplOutputCljsMeta value={this.props.value} core={this.props.core} />
    : null);
  }

  render() {
    const clazz = `fa fa-${this.state.collapse ? 'plus' : 'minus'}-square-o`;
    return (
      <span className='repl-cljs-wrapper'>
        {
          this.hasExtra
            ? <span className='repl-cljs-annotate'>
                <i className={clazz} onClick={this.onToggleCollapse}></i>
                {this.props.view}
                {this.getMeta()}
              </span>
            : this.props.view
        }
      </span>
    );
  }
}

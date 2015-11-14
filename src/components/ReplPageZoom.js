import React from 'react';
import _ from 'lodash';
import ReplPreferencesActions from '../actions/ReplPreferencesActions';

const zoomOptions = [0.75, 0.9, 1, 1.1, 1.2, 1.25, 1.3, 1.4, 1.5, 1.6, 1.7, 1.75, 1.8, 1,9, 2, 2.1, 2.2, 2.25, 2.3, 2.4, 2.5];
export default class ReplPageZoom extends React.Component {
  constructor(props) {
    super(props);
    this.onChangePageZoomFactor = this.onChangePageZoomFactor.bind(this);
    this.getZoomPercentage = this.getZoomPercentage.bind(this);
  }

  onChangePageZoomFactor(e) {
    ReplPreferencesActions.changePageZoomFactor(parseFloat(e.target.value));
  }

  getZoomPercentage(zoom) {
    return `${parseInt(zoom * 100)}%`;
  }
  render() {
    let zoom = global.Mancy.preferences.pageZoomFactor;
    return (
      <div className='preference'>
        <div className='preference-name'>
          Page zoom
        </div>
        <div className='preference-value'>
          <select onChange={this.onChangePageZoomFactor} title='Page Zoom Factor'>
            {
              _.map(zoomOptions, (z) => {
                return <option selected={z === zoom} value={z}>{this.getZoomPercentage(z)}</option>
              })
            }
          </select>
        </div>
      </div>
    );
  }
}

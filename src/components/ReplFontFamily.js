import React from 'react';
import _ from 'lodash';
import ReplPreferencesActions from '../actions/ReplPreferencesActions';
import RepFonts from '../common/ReplFonts';

export default class ReplFonts extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeFontFamily = this.onChangeFontFamily.bind(this);
  }

  onChangeFontFamily(e) {
    ReplPreferencesActions.changeFontFamily(e.target.value);
  }

  render() {
    let fonts = RepFonts.getSystemFonts();
    let font = global.Mancy.preferences.fontFamily;
    return (
      <span className='font-preferences'>
      {
        fonts.length
          ? <div className='preference'>
              <div className='preference-name'>
                Font
              </div>
              <div className='preference-value'>
                <select onChange={this.onChangeFontFamily} title='Font Family'>
                  {
                    _.map(fonts, (f) => {
                      return <option selected={f === font} value={f}>{f}</option>
                    })
                  }
                </select>
              </div>
            </div>
          : null
      }
      </span>
    );
  }
}

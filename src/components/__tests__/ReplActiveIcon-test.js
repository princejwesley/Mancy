
jest.dontMock('../ReplActiveIcon.js');

describe('ReplActiveIcon', () => {
  let React = require('react/addons');
  let ReplActiveIcon = require('../ReplActiveIcon.js');
  let TestUtils = React.addons.TestUtils;

  it('should rendered properly', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplActiveIcon />
    );
    let icon = TestUtils.findRenderedDOMComponentWithTag(component, 'i');
    expect(React.findDOMNode(icon).className).toEqual('fa fa-angle-right');
  });
});

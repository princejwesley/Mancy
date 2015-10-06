
jest.dontMock('../ReplOutputObject.js');
jest.dontMock('../../common/ReplOutput.js');

describe('ReplOutputObject', () => {
  let React = require('react/addons');
  let ReplOutputObject = require('../ReplOutputObject.js');
  let TestUtils = React.addons.TestUtils;
  let label = ' Object {}';
  let o = { name: 'mancy' };

  it('should have collapsed object', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplOutputObject object={o} />
    );

    let desc = TestUtils.findRenderedDOMComponentWithClass(component, 'object-desc');
    expect(React.findDOMNode(desc).textContent).toEqual(label);
    let entry = TestUtils.scryRenderedDOMComponentsWithClass(component, 'object-entry');
    expect(entry.length).toBe(0);
  });

  it('should expand object', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplOutputObject object={o} />
    );

    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'fa-play');
    TestUtils.Simulate.click(icon);

    let entries = TestUtils.scryRenderedDOMComponentsWithClass(component, 'object-entry');
    expect(entries.length).toBe(Object.keys(o).length);
  });

});

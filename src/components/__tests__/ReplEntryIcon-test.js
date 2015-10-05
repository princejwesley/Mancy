
jest.dontMock('../ReplEntryIcon.js');

describe('ReplEntryIcon', () => {
  let React = require('react/addons');
  let ReplEntryIcon = require('../ReplEntryIcon.js');
  let TestUtils = React.addons.TestUtils;

  it('should have expand icon', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryIcon collapse={true} onCollapse={fun}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithTag(component, 'i');
    expect(React.findDOMNode(icon).title).toEqual('expand command');

    TestUtils.Simulate.click(icon);
    expect(fun).toBeCalled();
  });

  it('should have collapse icon', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryIcon collapse={false} onCollapse={fun}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithTag(component, 'i');
    expect(React.findDOMNode(icon).title).toEqual('collapse command');

    TestUtils.Simulate.click(icon);
    expect(fun).toBeCalled();
  });
});

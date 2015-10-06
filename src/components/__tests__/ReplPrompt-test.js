
jest.dontMock('../ReplPrompt.js');
jest.dontMock('../ReplActiveIcon.js');
jest.dontMock('../ReplActiveInput.js');

describe('ReplPrompt', () => {
  let React = require('react/addons');
  let ReplPrompt = require('../ReplPrompt.js');
  let TestUtils = React.addons.TestUtils;

  it('should rendered properly', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplPrompt key={Date.now}
        history={[]}
        historyIndex={-1}
        historyStaged={''}
        command={''}
        mode={'REPL_MODE_MAGIC'}
        cursor= {0} />
    );
    let icon = TestUtils.findRenderedDOMComponentWithTag(component, 'i');
    expect(React.findDOMNode(icon).className).toEqual('fa fa-angle-right');
  });
});

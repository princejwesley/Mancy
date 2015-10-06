
jest.dontMock('../ReplEntries.js');
jest.dontMock('../ReplEntry.js');
jest.dontMock('md5');

describe('ReplEntries', () => {
  let React = require('react/addons');
  let ReplEntries = require('../ReplEntries.js');
  let TestUtils = React.addons.TestUtils;
  let entries = [{
    formattedOutput: '<span class="literal"> undefined </span>',
    plainCode: 'let name = "mancy"',
    status: true,
    command: '<span class="literal">let</span> name = <span class="string">"mancy"</span>'
  }];

  it('should rendered properly', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntries entries={entries} />
    );
    let children = TestUtils.scryRenderedDOMComponentsWithClass(component, 'repl-entry');
    expect(children.length).toBe(entries.length);
  });
});

import { getStore } from '../../stores/ReplConsoleStore.js';

jest.dontMock('../ReplConsole.js');
describe('ReplConsole', () => {
  let React = require('react/addons');
  let ReplConsole = require('../ReplConsole.js');
  let TestUtils = React.addons.TestUtils;

  it('should render console entries', () => {
    let storeContent = { entries: [
      { type: 'error', data: 'Error msg', time: Math.random() },
      { type: 'warn', data: 'Warning msg', time: Math.random() },
      { type: 'info', data: 'Info msg', time: Math.random() },
      { type: 'log', data: 'Log msg', time: Math.random() },
      { type: 'debug', data: 'Debug msg', time: Math.random() }
    ]};
    getStore.mockReturnValue(storeContent);

    let component = TestUtils.renderIntoDocument( <ReplConsole /> );
    expect(getStore).toBeCalled();

    let contents = TestUtils.scryRenderedDOMComponentsWithClass(component, 'repl-console-message-entry-content');
    expect(contents.length).toEqual(storeContent.entries.length);

  });
});

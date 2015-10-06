
jest.dontMock('../ReplStatusBar.js');

describe('ReplStatusBar', () => {
  let React = require('react/addons');
  let ReplStatusBar = require('../ReplStatusBar.js');
  let TestUtils = React.addons.TestUtils;
  let entries = [
    { status: false },
    { status: true },
    { status: true },
    { status: true },
    { status: false }
  ];

  it('should show counts & mode', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplStatusBar history={entries}
        mode={'REPL_MODE_MAGIC'}
        showConsole={false}
        showBell={false}
        onToggleConsole={fun}/>
    );
    let command = TestUtils.findRenderedDOMComponentWithClass(component, 'repl-status-bar-commands');
    let error = TestUtils.findRenderedDOMComponentWithClass(component, 'repl-status-bar-errors');
    let mode = TestUtils.findRenderedDOMComponentWithClass(component, 'repl-status-bar-mode');

    expect(React.findDOMNode(command).textContent).toEqual('3');
    expect(React.findDOMNode(error).textContent).toEqual('2');
    expect(React.findDOMNode(mode).textContent).toEqual('magic');
  });

  it('should show console bell', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplStatusBar history={entries}
        mode={'REPL_MODE_MAGIC'}
        showConsole={false}
        showBell={true}
        onToggleConsole={fun}/>
    );
    TestUtils.findRenderedDOMComponentWithClass(component, 'console-notification');
  });

  it('should toggle console', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplStatusBar history={entries}
        mode={'REPL_MODE_MAGIC'}
        showConsole={false}
        showBell={true}
        onToggleConsole={fun}/>
    );
    let console = TestUtils.findRenderedDOMComponentWithClass(component, 'repl-status-bar-console');
    TestUtils.Simulate.click(console);
    expect(fun).toBeCalled();
  });

  it('should show console', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplStatusBar history={entries}
        mode={'REPL_MODE_MAGIC'}
        showConsole={true}
        showBell={false}
        onToggleConsole={fun}/>
    );
    TestUtils.findRenderedDOMComponentWithClass(component, 'text-danger');
  });
});

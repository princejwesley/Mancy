
jest.dontMock('../ReplConsoleMessageFilters.js');

describe('ReplConsoleMessageFilters', () => {
  let React = require('react/addons');
  let ReplConsoleMessageFilters = require('../ReplConsoleMessageFilters.js');
  let TestUtils = React.addons.TestUtils;
  let labels = ['All', 'Error', 'Warning', 'Info', 'Log', 'Debug', 'Clear'];
  let displayLabels = ['A', 'E', 'W', 'I', 'L', 'D'];

  it('should render console labels', () => {
    let fun = jest.genMockFunction();
    let state = { all: true, error: true, warn: true, info: true, log: true, debug: true };
    let component = TestUtils.renderIntoDocument(
      <ReplConsoleMessageFilters
        filter={state}
        onAll={fun}
        onError={fun}
        onWarn={fun}
        onInfo={fun}
        onLog={fun}
        onClear={fun}
        onDebug={fun}/>
    );
    let filters = TestUtils.scryRenderedDOMComponentsWithClass(component, 'message-filter');
    expect(filters.length).toBe(labels.length);
    filters.forEach((filter) => {
      let node = React.findDOMNode(filter);
      expect(labels.indexOf(node.title)).not.toBe(-1);
    });
  });

  it('should toggle labels', () => {
    let fun = jest.genMockFunction();
    let state = { all: false, error: true, warn: true, info: true, log: true, debug: true };
    let component = TestUtils.renderIntoDocument(
      <ReplConsoleMessageFilters
        filter={state}
        onAll={fun}
        onError={fun}
        onWarn={fun}
        onInfo={fun}
        onLog={fun}
        onClear={fun}
        onDebug={fun}/>
    );
    let filters = TestUtils.scryRenderedDOMComponentsWithTag(component, 'input');
    filters.forEach((filter, idx) => {
      let node = React.findDOMNode(filter);
      expect(node.disabled).toBe(false);
      expect(labels.indexOf(node.value)).not.toBe(-1);
      TestUtils.Simulate.change(node);
      expect(fun.mock.calls.length).toBe(idx + 1);
    });
  });

  it('should check display labels', () => {
    let fun = jest.genMockFunction();
    let state = { all: false, error: true, warn: true, info: true, log: true, debug: true };
    let component = TestUtils.renderIntoDocument(
      <ReplConsoleMessageFilters
        filter={state}
        onAll={fun}
        onError={fun}
        onWarn={fun}
        onInfo={fun}
        onLog={fun}
        onClear={fun}
        onDebug={fun}/>
    );
    let filters = TestUtils.scryRenderedDOMComponentsWithClass(component, 'label');
    filters.forEach((filter, idx) => {
      let node = React.findDOMNode(filter);
      expect(displayLabels.indexOf(node.textContent.trim())).not.toBe(-1);
    });
  });

  it('should click on clear', () => {
    let fun = jest.genMockFunction();
    let clear = jest.genMockFunction();
    let state = { all: false, error: true, warn: true, info: true, log: true, debug: true };
    let component = TestUtils.renderIntoDocument(
      <ReplConsoleMessageFilters
        filter={state}
        onAll={fun}
        onError={fun}
        onWarn={fun}
        onInfo={fun}
        onLog={fun}
        onClear={clear}
        onDebug={fun}/>
    );
    let action = TestUtils.findRenderedDOMComponentWithClass(component, 'fa-ban');
    TestUtils.Simulate.click(React.findDOMNode(action));
    expect(fun).not.toBeCalled();
    expect(clear).toBeCalled();
    expect(clear.mock.calls.length).toBe(1);
  });
});

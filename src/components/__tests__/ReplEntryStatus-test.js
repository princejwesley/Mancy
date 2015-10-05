
jest.dontMock('../ReplEntryStatus.js');

describe('ReplEntryStatus', () => {
  let React = require('react/addons');
  let ReplEntryStatus = require('../ReplEntryStatus.js');
  let TestUtils = React.addons.TestUtils;

  it('should render entry status collapsed without error', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryStatus message={{status: true}} collapse={true}
        onReload={fun}
        onRemove={fun}
        onToggle={fun}/>
    );
    let errorIcon = TestUtils.scryRenderedDOMComponentsWithClass(component, 'fa-exclamation-triangle');
    expect(errorIcon.length).toBe(0);
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'plus');
    TestUtils.Simulate.click(icon);
    expect(fun).toBeCalled();
  });

  it('should render entry status expanded without error', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryStatus message={{status: true}} collapse={false}
        onReload={fun}
        onRemove={fun}
        onToggle={fun}/>
    );
    let errorIcon = TestUtils.scryRenderedDOMComponentsWithClass(component, 'fa-exclamation-triangle');
    expect(errorIcon.length).toBe(0);
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'minus');
    TestUtils.Simulate.click(icon);
    expect(fun).toBeCalled();
  });

  it('should render entry status with error', () => {
    let fun = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryStatus message={{status: false}} collapse={false}
        onReload={fun}
        onRemove={fun}
        onToggle={fun}/>
    );
    TestUtils.findRenderedDOMComponentWithClass(component, 'fa-exclamation-triangle');
  });

  it('should trigger reload', () => {
    let fun = jest.genMockFunction();
    let reload = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryStatus message={{status: false}} collapse={false}
        onReload={reload}
        onRemove={fun}
        onToggle={fun}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'repeat');
    TestUtils.Simulate.click(icon);
    expect(reload).toBeCalled();
    expect(fun).not.toBeCalled();
  });

  it('should trigger remove', () => {
    let fun = jest.genMockFunction();
    let remove = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryStatus message={{status: false}} collapse={false}
        onReload={fun}
        onRemove={remove}
        onToggle={fun}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'remove');
    TestUtils.Simulate.click(icon);
    expect(remove).toBeCalled();
    expect(fun).not.toBeCalled();
  });

  it('should trigger toggle', () => {
    let fun = jest.genMockFunction();
    let toggle = jest.genMockFunction();
    let component = TestUtils.renderIntoDocument(
      <ReplEntryStatus message={{status: false}} collapse={false}
        onReload={fun}
        onRemove={fun}
        onToggle={toggle}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'minus');
    TestUtils.Simulate.click(icon);
    expect(toggle).toBeCalled();
    expect(fun).not.toBeCalled();
  });

});

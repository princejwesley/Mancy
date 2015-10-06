import ReplActions from '../../actions/ReplActions';

jest.dontMock('../ReplEntry.js');
jest.dontMock('../ReplEntryIcon.js');
jest.dontMock('../ReplEntryStatus.js');

describe('ReplEntry', () => {
  let React = require('react/addons');
  let ReplEntry = require('../ReplEntry.js');
  let TestUtils = React.addons.TestUtils;
  let entry = {
    formattedOutput: '<span class="literal"> undefined </span>',
    plainCode: 'let name = "mancy"',
    status: true,
    command: '<span class="literal">let</span> name = <span class="string">"mancy"</span>'
  };

  it('should collapse', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntry log={entry} index={0} key={Date.now}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'repl-entry-icon');
    let action = TestUtils.findRenderedDOMComponentWithTag(icon, 'i');
    TestUtils.Simulate.click(action);
    expect(ReplActions.toggleCommandEntryView).toBeCalled();
  });

  it('should toggle entry', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntry log={entry} index={0} key={Date.now}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'fa fa-minus-circle');
    TestUtils.Simulate.click(icon);
    expect(ReplActions.toggleEntryView).toBeCalled();
  });

  it('should remove', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntry log={entry} index={0} key={Date.now}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'fa-times-circle');
    TestUtils.Simulate.click(icon);
    expect(ReplActions.removeEntry).toBeCalled();
  });

  it('should reload prompt', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntry log={entry} index={0} key={Date.now}/>
    );
    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'repeat');
    TestUtils.Simulate.click(icon);
    expect(ReplActions.reloadPrompt).toBeCalled();
  });

});

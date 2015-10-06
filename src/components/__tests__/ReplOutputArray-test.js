
jest.dontMock('../ReplOutputArray.js');
jest.dontMock('../../common/ReplOutput.js');

describe('ReplOutputArray', () => {
  let React = require('react/addons');
  let ReplOutputArray = require('../ReplOutputArray.js');
  let TestUtils = React.addons.TestUtils;
  let label = 'Array[7]';
  let arr = [0, true, 'yes', null, undefined, [1], {fun: () => {}}];

  it('should have collapsed array', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplOutputArray array={arr} label={label} start={0} noIndex={false}/>
    );

    let desc = TestUtils.findRenderedDOMComponentWithClass(component, 'array-desc');
    expect(React.findDOMNode(desc).textContent).toEqual(label);
    let entry = TestUtils.scryRenderedDOMComponentsWithClass(component, 'array-entry');
    expect(entry.length).toBe(0);
  });

  it('should expand array', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplOutputArray array={arr} label={label} start={0} noIndex={false}/>
    );

    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'fa-play');
    TestUtils.Simulate.click(icon);
    jest.runAllTicks();

    let entries = TestUtils.scryRenderedDOMComponentsWithClass(component, 'array-entry');
    expect(entries.length).toBe(arr.length);
  });

});

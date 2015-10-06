
jest.dontMock('../ReplOutputFunction.js');
jest.dontMock('../../common/ReplOutput.js');

describe('ReplOutputFunction', () => {
  let React = require('react/addons');
  let ReplOutputFunction = require('../ReplOutputFunction.js');
  let TestUtils = React.addons.TestUtils;
  let label = ' function() {}';
  let f = function test() {
    return 'test';
  };
  f.desc = 'testMe';
  let funElement = `
    <span class='literal'>function</span><span> test() {
      <span class='literal'>return</span> <span class='string'> 'test'</span>;
      }
    </span>
  `;
  let shortElement = `
    <span class='literal'>function</span><span> test() {
    </span>
  `;

  it('should have collapsed function', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplOutputFunction html={funElement} fun={f} expandable={false} short={shortElement}/>
    );

    let desc = TestUtils.findRenderedDOMComponentWithClass(component, 'object-desc');
    expect(React.findDOMNode(desc).textContent).toEqual(label);
    let entry = TestUtils.scryRenderedDOMComponentsWithClass(component, 'object-entry');
    expect(entry.length).toBe(0);
  });

  it('should expand function', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplOutputFunction html={funElement} fun={f} expandable={false} short={shortElement}/>
    );

    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'fa-play');
    TestUtils.Simulate.click(icon);
    jest.runAllTicks();

    let entries = TestUtils.scryRenderedDOMComponentsWithClass(component, 'object-entry');
    expect(entries.length).toBe(Object.keys(f).length);
  });

  it('should expand function source', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplOutputFunction html={funElement} fun={f} expandable={true} short={shortElement}/>
    );

    let icon = TestUtils.findRenderedDOMComponentWithClass(component, 'fa-play');
    TestUtils.Simulate.click(icon);
    jest.runAllTicks();
    let source = TestUtils.findRenderedDOMComponentWithClass(component, 'fa-plus-square-o');
    TestUtils.Simulate.click(source);
    jest.runAllTicks();
    TestUtils.scryRenderedDOMComponentsWithClass(component, 'fa-minus-square-o');
  });

});

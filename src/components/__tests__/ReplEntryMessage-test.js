import _ from 'lodash';
import {highlight} from '../../common/ReplCommon.js';
jest.dontMock('../ReplEntryMessage.js');

describe('ReplEntryMessage', () => {
  let React = require('react/addons');
  let ReplEntryMessage = require('../ReplEntryMessage.js');
  let TestUtils = React.addons.TestUtils;
  let msg = {
    formattedOutput: '<span class="literal"> undefined </span>',
    plainCode: 'let name = "mancy"',
    status: true,
    command: '<span class="literal">let</span> name = <span class="string">"mancy"</span>'
  };

  it('should display command', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntryMessage message={msg} collapse={false}
        commandCollapse={false}/>
    );
    let command = TestUtils.findRenderedDOMComponentWithClass(component, 'repl-entry-message-command');
    let id = React.findDOMNode(command)._attributes['data-reactid']._valueForAttrModified;
    expect(id.endsWith('long')).toBe(true);
    TestUtils.findRenderedDOMComponentWithClass(component, 'repl-entry-message-output')
  });

  it('should display command with collapsed output', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntryMessage message={msg} collapse={true}
        commandCollapse={false}/>
    );
    let command = TestUtils.scryRenderedDOMComponentsWithClass(component, 'repl-entry-message-output');
    expect(command.length).toBe(0);
  });

  it('should display with collapsed command', () => {
    let longMsg = _.extend(msg, {
      plainCode : "let fun = () => {\n return; \n}"
    });
    highlight.mockImpl(() => 'let fun = () => {');
    let component = TestUtils.renderIntoDocument(
      <ReplEntryMessage message={longMsg} collapse={false}
        commandCollapse={true}/>
    );
    TestUtils.findRenderedDOMComponentWithClass(component, 'ellipsis');
  });


});

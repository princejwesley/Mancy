
jest.dontMock('../ReplEntryOutputError.js');

describe('ReplEntryOutputError', () => {
  let React = require('react/addons');
  let ReplEntryOutputError = require('../ReplEntryOutputError.js');
  let TestUtils = React.addons.TestUtils;
  let error = 'name is not defined';
  let errorFile = 'repl.js';
  let errorFunction = 'REPLServer.defaultEval';
  let errorLine = '166';
  let errorColumn = '27';
  let msg = `ReferenceError:  ${error}`;
  let trace = [`at ${errorFunction} (${errorFile}:${errorLine}:${errorColumn})`];

  it('should rendered properly', () => {
    let component = TestUtils.renderIntoDocument(
      <ReplEntryOutputError message={msg} trace={trace}>
      </ReplEntryOutputError>
    );
    let errorMsg = TestUtils.findRenderedDOMComponentWithClass(component, 'repl-entry-output-error-message');
    let errorTraceFile = TestUtils.findRenderedDOMComponentWithClass(component, 'stack-error-file');
    let errorTraceFunction = TestUtils.findRenderedDOMComponentWithClass(component, 'stack-error-function');
    let errorTraceLine = TestUtils.findRenderedDOMComponentWithClass(component, 'stack-error-row');
    let errorTraceColumn = TestUtils.findRenderedDOMComponentWithClass(component, 'stack-error-column');

    expect(React.findDOMNode(errorMsg).textContent).toContain(error);
    expect(React.findDOMNode(errorTraceFile).textContent).toContain(errorFile);
    expect(React.findDOMNode(errorTraceFunction).textContent).toContain(errorFunction);
    expect(React.findDOMNode(errorTraceLine).textContent).toContain(errorLine);
    expect(React.findDOMNode(errorTraceColumn).textContent).toContain(errorColumn);
  });
});

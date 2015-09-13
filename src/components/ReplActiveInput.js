import React from 'react';
import _ from 'lodash';
import repl from 'repl';
import {Readable, Writable} from 'stream';
import {EOL} from 'os';

export default class ReplActiveInput extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    const node = React.findDOMNode(this);
    // set focus
    node.focus();
    // set cursor position
    const selection = window.getSelection();
    selection.collapse(node, 0);
  }
  onKeyDown(e) {
    console.log(this)
    const cli = ReplActiveInput.getRepl();
    if(e.key === 'Tab') {
      console.log('tab clicked - time for auto complete')
    } else if(e.key === 'Enter') {
      console.log('submit to nodejs')
      const text = React.findDOMNode(this).innerText;
      console.log(text)
      console.log(cli)
      cli.input.emit('data', text)
      cli.input.emit('data', EOL)
    }
    // e.persist(); // remove after testing
    // console.log(e)
  }
  render() {
    return (
      <div autoFocus className='repl-active-input' contentEditable={true} onKeyDown={this.onKeyDown.bind(this)}>
      </div>
    );
  }

  static getRepl = (() => {
    let readable = new Readable();
    let writable = new Writable();

    readable._read = () => {};
    writable._write = (data, encoding, next) => {
      console.log('--write--',data.toString())
      next();
    }
    writable.write = function(data) {
      console.log("'",data.toString(),"''", 'here')
    }

    let nodeRepl = repl.start({
      prompt: '',
      input: readable,
      output: writable,
      terminal: false,
      useGlobal: false,
      ignoreUndefined: false,
      useColors: false,
      // writer: require('util').inspect,
      replMode: repl.REPL_MODE_SLOPPY,
      // eval: (cmd, context, filename, cb) => {
      //   console.log('--eval--')
      //   cb(null, result);
      // },
    });

    return () => {
      return nodeRepl;
    };
  })();

}

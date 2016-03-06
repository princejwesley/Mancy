import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from '../common/ReplCommon';
import {EOL} from 'os';

// Not very generic but sufficient to handle our usecase
let ReplDOM = {
  execCommand: (dom, cmd, arg) => {
    let selection = window.getSelection();
    let range = document.createRange();
    range.selectNodeContents(dom);
    selection.removeAllRanges();
    selection.addRange(range);

    document.execCommand(cmd, false, arg);
  },
  toHTMLBody: (str) => {
    let body = document.createElement('body');
    body.innerHTML = str;
    let result = _.find(body.childNodes,
      (node) => node.nodeName !== 'ANONYMOUS' && node.nodeType === document.ELEMENT_NODE);
    return result ? body : null;
  },
  scrollToEnd: (dom, timeout = 50) => {
    let fun = dom
      ? () => { dom.scrollTop = dom.scrollHeight; }
      : () => window.scrollTo(0, document.body.scrollHeight);
    window.setTimeout(fun, timeout);
  },
  getViewportSize: () => {
    //refer http://stackoverflow.com/a/8876069/571189
    return {
      width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    };
  },
  focusOn: (dom) => {
    dom.focus();
  },
  getTextNodeTreeWalker: (dom, range) => {
    return document.createTreeWalker(
      dom,
      NodeFilter.SHOW_TEXT,
      (node) => {
        let nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        return (!range || nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1) ?
          NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
      false
    );
  },
  getCursorPositionRelativeTo: (dom) => {
    const range = window.getSelection().getRangeAt(0);
    let pos = 0;
    let done = false;
    let remainings = (nodeRange, range) => {
      const leftOver = (nrange, srange) => {
        let pos = 0;
        if(nrange.compareBoundaryPoints(Range.END_TO_START, srange) <= 0) {
          let child = nrange.endContainer.childNodes;
          if(child.length) {
            _.each(child, (n) => {
              if(n.isSameNode(srange.startContainer)) {
                pos += srange.startOffset;
              } else {
                let nr = document.createRange();
                nr.selectNodeContents(n);
                if(nr.compareBoundaryPoints(Range.END_TO_END, srange) < 1) {
                  pos += n.textContent.length;
                } else {
                  pos += leftOver(nr, srange);
                }
              }
            });
          } else {
            pos += range.endOffset;
          }
        }
        return pos;
      };
      return leftOver(nodeRange, range);
    };

    let treeWalker = document.createTreeWalker(
      dom,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      // null,
      (node) => {
        let nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        let filter = !node.isSameNode(range.endContainer) &&
          nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ?
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        if(filter === NodeFilter.FILTER_REJECT) {
          pos += remainings(nodeRange, range);
          pos += (node.nodeName === 'DIV' ? 1 : 0);
          done = true;
        }
        return done ? NodeFilter.FILTER_REJECT : filter;
      },
      false
    );
    while(!done && treeWalker.nextNode()) {
      let cnode = treeWalker.currentNode;
      if(cnode.nodeType != 1) {
        pos += cnode.textContent.length;
      } else if(cnode.nodeName === 'DIV') {
        pos += 1;
      }
    }
    return pos;
  },
  setCursorPositionRelativeTo: (pos, dom) => {
    let treeWalker = ReplDOM.getTextNodeTreeWalker(dom);
    let idx = pos;
    while( treeWalker.nextNode() && (idx - treeWalker.currentNode.length > 0)) {
      idx -= treeWalker.currentNode.length;
    }

    if(treeWalker.currentNode) {
      let range = document.createRange();
      range.selectNodeContents(dom);
      range.setStart(treeWalker.currentNode, idx);
      range.collapse(true);
      let selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  },
  // for auto complete
  getAutoCompletePosition: (id) => {
    const viewport = ReplDOM.getViewportSize();
    const prompt = document.getElementById(id);
    if(!prompt) { return; }
    const cursorElement = prompt.getElementsByClassName('CodeMirror-cursor')[0];
    if(!cursorElement) { return; }

    const area = cursorElement.getBoundingClientRect();
    let y = area.bottom + 5;
    let x = area.left;
    let topBottom = 'top';
    let leftRight = 'left';

    // max height/ width for suggestion component is 200/300
    if(y + 200 > viewport.height) {
      y =  2 * viewport.height - document.body.clientHeight - area.top;
      topBottom = 'bottom';
    }
    if(x + 300 > viewport.width) {
      x = (viewport.width - x) / 2;
      leftRight = 'right';
    }
    return {
      [topBottom]: y + 'px',
      [leftRight]: x + 'px'
    };
  }
}

export default ReplDOM;

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
  moveCursorToEndOf: (dom) => {
    let range = document.createRange();
    range.selectNodeContents(dom);
    range.collapse(true);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },
  moveCursorUp: (up, dom) => {
    let position = ReplDOM.getCursorPositionRelativeTo(dom);
    let element = dom || document.activeElement;
    let text = element.innerText;
    let left = text.substring(0, position);
    let right = text.substring(position);
    let upLines = left.split(EOL);
    let currentLine = upLines.pop();
    if(up) {
      if(!upLines.length) { return false; }
      let previousLine = upLines.pop().substring(0, currentLine.length);
      ReplDOM.setCursorPositionRelativeTo(ReplCommon.linesLength(upLines) + previousLine.length, dom);
    } else {
      let downLines = right.split(EOL);
      let [ rstr, ...lines ] = downLines;
      if(!lines.length) { return false; }
      let nextLine = lines[0].substring(0, currentLine.length);
      ReplDOM.setCursorPositionRelativeTo(rstr.length + left.length + nextLine.length + 1, dom);
    }
    return true;
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
  removeEmptyTextNode: (dom) => {
    _.each(dom.childNodes, (n) => {
      if(n && n.nodeType == 3 && (n.textContent === '\n' || !n.textContent.length)) {
        dom.removeChild(n);
      } else if(n) {
        ReplDOM.removeEmptyTextNode(n);
      }
    });
  },
  getCursorPositionRelativeTo: (dom) => {
    const range = window.getSelection().getRangeAt(0);
    let pos = 0;
    let done = false;
    let remainings = (nodeRange, range) => {
      const leftOver = (nrange, srange) => {
        let pos = 0;
        if(nrange.compareBoundaryPoints(Range.END_TO_START, srange) <= 0) {
          let child = nrange.startContainer.childNodes;
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
            pos += range.startOffset;
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
  getAutoCompletePosition: () => {
    let selection = window.getSelection();
    let range = selection.getRangeAt(0).cloneRange();

    if(range.startOffset > 0 && range.startContainer.data) {
      let data = range.startContainer.data;
      let left = data.substring(0, range.startOffset);
      let words = left.split(/\s/);
      let lastWord = words[words.length - 1];
      let last = lastWord.length - lastWord.replace(/^.*\./,'').length;
      let rest = words.slice(0, words.length - 1).join(' ').length;
      range.setStart(range.startContainer, rest + last);
    }

    let area = range.getClientRects()[0];

    if(!area) { return; }

    // consider parent node height -- repl prompt
    let node = range.startContainer.parentNode.parentNode;
    let viewport = ReplDOM.getViewportSize();
    let prompt = document.getElementsByClassName(node.className)[0];
    let nodeStyle = window.getComputedStyle(prompt);
    let offsetTop = parseInt(nodeStyle.marginTop) + parseInt(nodeStyle.borderTopWidth)
      + parseInt(nodeStyle.paddingTop);
    let offsetBottom = parseInt(nodeStyle.marginBottom) + parseInt(nodeStyle.borderBottomWidth)
      + parseInt(nodeStyle.paddingBottom);
    let y = area.bottom + offsetTop + 5;
    let x = area.left;
    let topBottom = 'top';
    let leftRight = 'left';

    // max height/ width for suggestion component is 200/300
    if(y + 200 > viewport.height) {
      y =  2 * viewport.height - document.body.clientHeight - area.top
            + offsetBottom;
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

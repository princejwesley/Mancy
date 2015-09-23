import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';
import ReplCommon from '../common/ReplCommon';
import {EOL} from 'os';

// Not very generic but sufficient to handle our usecase
let ReplDOM = {
  scrollToEnd: () => {
    window.setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 50);
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
  setCursorPosition: (pos, dom) => {
    // handled for single child node
    let range = document.createRange();
    dom = dom || document.activeElement;
    range.selectNodeContents(dom);

    if(dom.innerText.length >= pos && dom.childNodes.length) {
      range.setStart(dom.childNodes[0], pos);
    }
    range.collapse(true);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },
  getCursorPositionRelativeTo: (dom) => {
    let selection = window.getSelection();
    if (selection.rangeCount <= 0) { return 0; }
    let range = selection.getRangeAt(0);
    const endNode = range.endContainer.nodeType === 3 ? range.endContainer.parentNode : range.endContainer;

    let getCaretPosition = (nodes, endNode, range, pos) => {
      if(!nodes.length) { return pos; }
      let [first, ...rest] = nodes;
      if(first.isSameNode(endNode)) { return pos + range.endOffset; }
      return getCaretPosition(rest, endNode, range, pos + first.textContent.length + 1)
    };
    return endNode.isSameNode(dom)
      ? range.endOffset
      : getCaretPosition(ReplCommon.toArray(dom.childNodes), endNode, range, 0);
  },
  setCursorPositionRelativeTo: (pos, dom) => {
    let findNodeWithPos = (nodes, pos) => {
      if(nodes.length === 0 || pos < 0) {
        return [null, -1];
      } else {
        let [first, ...rest] = nodes;
        let len = first.textContent.length + 1;
        return len > pos
          ? [first, pos]
          : findNodeWithPos(rest, pos - len);
      }
    };
    let [node, idx] = findNodeWithPos(ReplCommon.toArray(dom.childNodes), pos)
    if(node) {
      let range = document.createRange();
      range.selectNodeContents(dom);
      range.setStart((idx && node.nodeType === 1)
        ? node.childNodes[0]
        : node, idx);
      range.collapse(true);
      let selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  },
  getCursorPosition: () => {
    let selection = window.getSelection();
    if (selection.rangeCount <= 0) { return 0; }
    let range = selection.getRangeAt(0).cloneRange();
    return range.endOffset;
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

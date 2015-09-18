import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';

// Not very generic but sufficient to handle our usecase
let ReplDOM = {
  scrollToEnd: () => {
    window.scrollTo(0, document.body.scrollHeight);
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
    console.log(range, 'moveCursorToEndOf')
    range.collapse(true);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },
  setCursorPosition: (pos, dom) => {
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
  getCursorPosition: () => {
    let selection = window.getSelection();
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

    // max height/ width for suggestion component is 200
    if(y + 200 > viewport.height) {
      y =  2 * viewport.height - document.body.clientHeight - area.top
            + offsetBottom;
      topBottom = 'bottom';
    }
    if(x + 200 > viewport.width) {
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

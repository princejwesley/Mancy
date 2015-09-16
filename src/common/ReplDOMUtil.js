import _ from 'lodash';
import ReplConstants from '../constants/ReplConstants';

// Not very generic but sufficient to handle our usecase
let ReplDOMUtil = {
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
    range.collapse(true);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },
  // for auto complete
  getAutoCompletePosition: () => {
    let selection = window.getSelection();
    let range = selection.getRangeAt(0).cloneRange();

    let area = range.getClientRects()[0];
    // consider parent node height -- repl prompt
    let node = range.startContainer.parentNode;
    console.log('area', range.getClientRects(), area, node.clientHeight, range, ReplDOMUtil.getViewportSize())
    return {
      top: area.bottom + node.offsetTop,
      left: area.left
    };
  }
}



export default ReplDOMUtil;


class ReplUndoItem {
  constructor(ts, action, data) {
    this.ts = ts;
    this.action = action;
    this.data = data;
  }
}

// seconds pulse
export default class ReplUndo {
  constructor(context=null, pulse = 1000) {
    this.stack = [];
    this.pos = -1;
    this.pulse = Math.abs(pulse);
    this.context = context;
  }

  add(data, action) {
    let nts = parseInt(Date.now() / this.pulse);
    let item = new ReplUndoItem(nts, action, data);
    if(this.pos > 0) {
      let {ts} = this.stack[this.pos];
      if(ts !== nts) {
        this.pos++;
        this.stack.splice(this.pos);
        this.stack.push(item);
      } else {
        this.stack[this.pos] = item;
      }
    } else {
      this.pos = 0;
      this.stack.push(item);
    }
  }

  undo(data, action) {
    if(this.pos >= 0) {
      let {action, data} = this.stack[this.pos];
      this.pos--;
      action.call(this.context, data, ReplUndo.Undo);
    }
  }

  redo(data, action) {
    const item = this.stack[this.pos + 1];
    if(item) {
      let {action, data} = item;
      this.pos++;
      action.call(this.context, data, ReplUndo.Redo);
    }
  }

  reset() {
    this.stack = [];
    this.pos = -1;
  }

  static Undo = Symbol('undo');
  static Redo = Symbol('redo');
}

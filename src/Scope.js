export default class Scope {
  constructor(closure, label, isJoint=false) {
    this.closure = closure;
    this.label = label;
    this.isJoin = !!isJoint;
  }

  apply(q) {
    this.closure(q);
    return q;
  }
}

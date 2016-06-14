class Scope {
  constructor(closure, label, isJoint=false) {
    this.closure = closure;
    this.label = label;
    this.isJoint = !!isJoint;
  }

  apply(q) {
    this.closure(q);
    return q;
  }
}

module.exports = Scope;

class Track {
  constructor(scopes=[]) {
    this.scopes = scopes;
  }

  apply(q) {
    return this.scopes.reduce((q, scope) => scope.apply(q), q);
  }

  hasJoint(label) {
    const i = this.scopes.map((scope) => scope.label).indexOf(label);
    return i > -1 && this.scopes[i].isJoint;
  }

  hasScope(label) {
    return this.scopes.map((scope) => scope.label).indexOf(label) > -1;
  }

  push(scope) {
    if (scope.isJoint && this.hasJoint(scope.label)) {
      return this;
    } else {
      this.scopes.push(scope);
      return this;
    }
  }

  fork() {
    return new Track(this.scopes.slice(0));
  }

  rewind() {
    this.scopes.pop();
    return this;
  }

  merge(track) {
    track.scopes.forEach((scope) => {
      this.scopes.push(scope);
    });

    return this;
  }

  relabelLastScope(name) {
    if (this.scopes.length === 0) {
      return this;
    }

    this.scopes.slice(-1)[0].label = name;
    return this;
  }

  convertLastScopeToJoint() {
    if (this.scopes.length === 0) {
      return this;
    }

    this.scopes.slice(-1)(0).isJoint = true;
    return this;
  }
}

module.exports = Track;

const Scoper = require('./Scoper');

class ScoperAsync extends Scoper {
  apply(table, params) {
    const actionableParams = this.actionableParams(params);

    return actionableParams
      .filter(({key}) => this.scopes.has(key))
      .reduce((chain, {key, val}) => chain.then((t) => {
        const scope = this.scopes.get(key);
        if (scope instanceof Scoper) {
          return scope.run(t, val, key).then((t) => t);
        } else {
          return scope.bind(this)(t, val, key).then((t) => t);
        }
      }, Promise.resolve(table)))
    ;
  }
}

module.exports = ScoperAsync;

const Scoper = require('./Scoper');

class ScoperAsync extends Scoper {
  apply(table, params) {
    const actionableParams = this.actionableParams(params);

    return Promise.all(actionableParams
      .filter(({key}) => this.scopes.has(key))
      .map(({key, val}) => {
        const scope = this.scopes.get(key);
        if (scope instanceof Scoper) {
          return scope.run(table, val, key).then((t) => t);
        } else {
          return scope.bind(this)(table, val, key).then((t) => t);
        }
      })).then(() => table)
    ;
  }
}

module.exports = ScoperAsync;

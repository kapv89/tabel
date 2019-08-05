/**
 * Usage:
 *
 * 'eagerLoader'
 * new Scoper([
 *   {key: 'posts', scope(t) { t.eagerLoad(['posts']); }}
 *   {key: 'posts.tags', scope(t) { t.eagerLoad['posts.tags']; }}
 *   {key: 'posts.comments', scope(t) { t.eagerLoad['posts.comments']; }}
 *   {key: 'posts.tags.posts', scope(t) { t.eagerLoad['posts.tags.posts']; }}
 * ]);
 *
 * 'filterer'
 * new Scoper([
 *   {key: 'posts.ids', scope(t, ids=[]) {
 *     if (ids.length > 0) {
 *       t.posts().join(t).whereIn('posts.id', ids);
 *     }
 *   }},
 *
 *   {key: 'name', scope(t, val) { t.where('name', like, val); }}
 *   {key: 'posts.count.gte', scope(t, val) {
 *     val = parseInt(val, 10);
 *     if (isFinite(val)) {
 *       t.posts().join(t).groupBy(t.keyCol()).having(t.raw('count(posts.id)'), '>=', val)
 *     }
 *   }}
 * ]);
 */

const {isArray, isObject} = require('lodash');

class Scoper {
  constructor(scopes=[]) {
    this.scopes = new Map();

    this.addScopes(scopes);
  }

  addScopes(scopes=[]) {
    if (isObject(scopes) && !isArray(scopes)) {
      scopes = Object.keys(scopes).map((k) => ({key: k, scope: scopes[k]}));
    }

    scopes.forEach(({key, scope}) => {
      this.scopes.set(key, scope);
    });

    return this;
  }

  addScope({key, scope}) {
    return this.addScopes([{key, scope}]);
  }

  merge(scoper) {
    Array.from(scoper.scopes.keys()).forEach((k) => {
      this.scopes.set(k, scoper.scopes.get(k));
    });

    return this;
  }

  apply(table, params) {
    const actionableParams = this.actionableParams(params);

    return Promise.all(actionableParams
      .filter(({key}) => this.scopes.has(key))
      .map(({key, val}) => {
        return this.scopes.get(key).bind(this)(table, val, key);
      }, table)).then(() => table)
    ;
  }

  actionableParams(params={}) {
    if (isArray(params)) {
      return params.reduce((actionableParams, param) => {
        return actionableParams.concat([{
          key: param, val: null
        }]);
      }, []);
    } else if (isObject(params)) {
      return Object.keys(params).reduce((actionableParams, param) => {
        return actionableParams.concat([{
          key: param, val: params[param]
        }]);
      }, []);
    } else {
      throw new Error('invalid params');
    }
  }
}

module.exports = Scoper;

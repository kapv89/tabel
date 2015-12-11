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

import {isArray, isObject} from 'lodash';

export default class Scoper {
  constructor(container, scopes=[]) {
    this.container = container;
    this.scopes = new Map();

    this.addScopes(scopes);
  }

  scoper(name) {
    return this.container.scoper(name);
  }

  addScopes(scopes=[]) {
    if (isObject(scopes) && ! isArray(scopes)) {
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

  run(table, params) {
    const actionableParams = this.actionableParams(params);

    return actionableParams
      .filter(({key}) => this.scopes.has(key))
      .reduce((t, {key, val}) => {
        const scope = this.scopes.get(key);
        if (scope instanceof Scoper) {
          scope.run(t, val, key);
        } else {
          scope.bind(this)(t, val, key);
        }
        return t;
      }, table)
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

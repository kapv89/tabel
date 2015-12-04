/**
 * Promise based transformation of data from one form to another
 *
 * Usage:
 *
 * orm.util.defineTransformer(
 *   'posts.list',
 *   {
 *     ['filters'](filters, input) {
 *       return this.transformer('posts.filters').run(filters);
 *     },
 *     ['sortings'](sortings, input) {
 *       return this.transformer('posts.sortings').run(sortings);
 *     },
 *     ['eagerLoads'](eagerLoads, input) {
 *       return this.transformer(posts.eagerLoads').run(eagerLoads);
 *     }
 *   }
 * );
 *
 * orm.util.defineTransformer(
 *   'posts.filters',
 *   {
 *     ['tag.ids'](ids, input) {
 *       if (! isArray(ids)) {
 *         return Promise.resolve([]);
 *       } else {
 *         return orm.tbl('tags').whereIn('id', ids).all()
 *           .then((tags) => tags.id);
 *       }
 *     }
 *   }
 * );
 */

import {isPlainObject, assign} from 'lodash';

export default class Transformer {
  constructor(container, transformations=[]) {
    this.container = container;
    this.transformations = new Map();

    this.addTransformations(transformations);
  }

  transformer(name) {
    return this.container.transformer(name);
  }

  addTransformations(transformations=[]) {
    if (isPlainObject(transformations)) {
      transformations = Object.keys(transformations).map((k) => ({key: k, transformation: transformations[k]}));
    }

    transformations.forEach(({key, transformation}) => {
      this.transformations.set(key, transformation);
    });

    return this;
  }

  addTransformation({key, transformation}) {
    this.transformations.set(key, transformation);
    return this;
  }

  run(input={}) {
    const keys = Object.keys(input).filter((key) => this.transformations.has(key));

    return Promise.all(
      keys.map((key) => this.transformations.get(key).bind(this)(input[key], input, key))
    )
    .then((outValues) => outValues.reduce((output, value, index) => {
      return assign(output, {[keys[index]]: value});
    }, {}));
  }
}

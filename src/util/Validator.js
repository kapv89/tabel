/**
 * Promise based validation of input
 *
 * Usage
 *
 * orm.util.defineValidator(
 *   'posts.new',
 *   {
 *     ['user_id'](userId, input) {
 *       return orm.table('users').find(userId)
 *         .then((user) => {
 *           if (user) {
 *             return null;
 *           } else {
 *             return 'invalid user'
 *           }
 *         });
 *     },
 *     ['title'](title, input) {
 *       return Promise.all([
 *         ! isString(title) ? 'title is required' : null,
 *         orm.tbl('posts').find({title}).then((existing) => {
 *           return !!existing ? 'title should be unique' : null;
 *         })
 *       ]).then((errors) => compact(errors));
 *     },
 *     ['meta'](meta, input) {
 *       if (! isPlainObject(meta)) {
 *         return ['meta should be an object'];
 *       } else {
 *         return compact(['target_country', 'twitter:og'].map((k) => {
 *           return ! isString(meta[k]) ? 'you need to provide meta info' : null;
 *         }));
 *       }
 *     }
 *   }
 * )
 */

import {assign, isArray, isPlainObject} from 'lodash';

export default class Validator {
  constructor(container, validations=[]) {
    this.container = container;
    this.validations = new Map();

    this.addValidations(validations);
  }

  validator(name) {
    return this.container.validator(name);
  }

  addValidations(validations=[]) {
    if (isPlainObject(validations)) {
      validations = Object.keys(validations).map((k) => ({key: k, validation: validations[k]}));
    }

    validations.forEach(({key, validation}) => {
      this.validations.set(key, validation);
    });

    return this;
  }

  addValidation({key, validation}) {
    this.validations.set(key, validation);
    return this;
  }

  findErrors(input={}) {
    const keys = Object.keys(input).filter((k) => this.validations.has(k));

    return Promise.all(
      keys.map((k) => this.validations.get(k).bind(this)(input[k], input, k))
    )
    .then((errorMessages) => errorMessages.filter((msg) => {
      return isArray(msg) ? msg.length > 0 : !!msg;
    }))
    .then((errorMessages) => {
      if (errorMessages.length === 0) {
        return null;
      } else {
        return errorMessages.reduce((errors, msg, index) => {
          return assign({
            [keys[index]]: isArray(msg) ? msg : (
              isPlainObject(msg) ? msg : [msg]
            )
          });
        }, {});
      }
    });
  }
}

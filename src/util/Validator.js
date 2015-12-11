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
 *       if (! isUsableObject(meta)) {
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

import {assign, isArray, toPlainObject} from 'lodash';

import isUsableObject from '../isUsableObject';

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
    if (isUsableObject(validations)) {
      validations = toPlainObject(validations);
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

  merge(validator) {
    Array.from(validator.validation.keys()).forEach((k) => {
      this.validations.set(k, validator.validations.get(k));
    });

    return this;
  }

  findErrors(input={}) {
    const keys = Array.from(this.validation.keys());

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
              isUsableObject(msg) ? toPlainObject(msg) : [msg]
            )
          });
        }, {});
      }
    });
  }
}

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
  constructor(validations=[]) {
    this.validations = new Map();

    this.addValidations(validations);
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
    const keys = Array.from(this.validations.keys());

    return Promise.all(
      keys.map((k) => {
        const validated = this.validations.get(k).bind(this)(input[k], input, k);
        if (validated instanceof Promise) {
          return validated.then((errors) => {
            return {key: k, errors};
          });
        } else if (validated instanceof Validator) {
          return validated.findErrors(input[k]).then((errors) => {
            return {key: k, errors};
          });
        } else {
          return {key: k, errors: validated};
        }
      })
    )
    .then((errorMessages) => errorMessages.filter((msg) => {
      return isArray(msg.errors) ? msg.errors.length > 0 : !!msg.errors;
    }))
    .then((errorMessages) => {
      if (errorMessages.length === 0) {
        return null;
      } else {
        return errorMessages.reduce((allErrors, {key, errors}) => {
          return assign(allErrors, {
            [key]: isArray(errors) ? errors : (
              isUsableObject(errors) ? toPlainObject(errors) : [errors]
            )
          });
        }, {});
      }
    });
  }
}

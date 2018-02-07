/**
 * Promise based validation of input
 *

const Shape = require('shape-errors');
const s = new Shape({
  user_id: (userId) => userExists(userId).then((exists) => exists ? null : 'invalid'),
  name: (name, {user_id}) => findUserByName(name).then(
    (user) => user.id === user_id ? null : 'invalid'
  )
})

s.errors(data).then(({result, errors}) => {})
*/

const {assign, toPlainObject} = require('lodash');

const isUsableObject = require('isusableobject');

class Shape {
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

  errors(input={}) {
    const invalidInputKeysErr = Object.keys(input)
      .filter((k) => {
        return Array.from(this.validations.keys()).indexOf(k) === -1;
      })
      .reduce((err, k) => ({
        ...err,
        [k]: 'invalid key'
      }), {})
    ;

    return Promise.all(
      Array.from(this.validations.keys()).map((key) => {
        const err = this.validations.get(key)(input[key], input, key);

        if (err instanceof Promise) {
          return err.then((err) => {
            return {key, err};
          });
        } else if (err instanceof Shape) {
          return err.errors(input[key]).then((err) => {
            return {key, err};
          });
        } else {
          return {key, err};
        }
      })
    )
    .then((checks) => {
      if (checks.filter(({err}) => !!err).length === 0 && Object.keys(invalidInputKeysErr).length === 0) {
        return null;
      } else {
        return checks.reduce((all, {key, err}) => {
          return assign(all, {[key]: err});
        }, invalidInputKeysErr);
      }
    });
  }
}

module.exports = Shape;

/**
 * An orm utils manager
 */

import Scoper from './Scoper';
import Transformer from './Transformer';
import Validator from './Validator';

export default class Util {
  constructor(orm) {
    this.orm = orm;
    this.scopers = new Map();
    this.transformers = new Map();
    this.validators = new Map();
  }

  newScoper(scopes) {
    return new Scoper(scopes);
  }

  defineScoper(name, scopes) {
    this.scopers.set(name, this.newScoper(scopes));
    return this;
  }

  scoper(name) {
    return this.scopers.get(name);
  }

  newTransformer(transformations) {
    return new Transformer(transformations);
  }

  defineTransformer(name, transformations) {
    this.transformers.set(name, this.newTransformer(transformations));
    return this;
  }

  transformer(name) {
    return this.transformers.get(name);
  }

  newValidator(validations) {
    return new Validator(validations);
  }

  defineValidator(name, validations) {
    this.validators.set(name, this.newValidator(validations));
    return this;
  }

  validator(name) {
    return this.validators.get(name);
  }
}

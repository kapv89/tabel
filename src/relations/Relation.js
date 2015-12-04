/**
 * Already used methods:
 * - setName
 * - forModel
 * - constrain
 * - eagerLoad
 * - load
 */

import {isString} from 'lodash';

import Scope from '../Scope';
import Track from '../Track';

export default class Relation {
  constructor() {
    this.constraints = new Track();
    this.activeModel = null;
    this.relationName = null;
  }

  setName(relationName) {
    this.relationName = relationName;
    return this;
  }

  forModel(model) {
    this.activeModel = model;
    return this;
  }

  constrain(constraint, label='constraint') {
    this.constraints.push(new Scope(constraint, label));
    return this;
  }

  eagerLoad(...args) {
    return this.constrain((t) => t.eagerLoad(...args), 'eagerLoad');
  }

  load(fromModels=[]) {
    if (fromModels.length === 0) {
      return Promise.resolve(fromModels);
    }

    return this.getRelated(fromModels).then((relatedModels) => {
      return this.matchModels(this.initRelation(fromModels), relatedModels);
    });
  }

  initRelation(fromModels=[]) {
    throw new Error('not implemented');
  }

  getRelated(fromModels=[]) {
    throw new Error('not implemented');
  }

  matchModels(fromModels=[], relatedModels=[]) {
    throw new Error('not implemented');
  }

  jointLabel(label, {isLeftJoin=false}) {
    return `${
      isLeftJoin ? 'leftJoin' : 'join'
    }.${this.constructor.name}.${this.relationName}${
      isString(label) ? `.${label}` : ''
    }`;
  }

  pivotJointLabel(label, {isLeftJoin=false}) {
    return `${this.jointLabel(label, {isLeftJoin})}.pivot${
      isString(label) ? `.${label}` : ''
    }`;
  }

  throughJointLabel(label, {isLeftJoin=false}) {
    return `${this.jointLabel(label, {isLeftJoin})}.through${
      isString(label) ? `.${label}` : ''
    }`;
  }

  join(tableContext) {
    throw new Error('not implemented');
  }

  joinPivot(tableContext) {
    throw new Error('not imeplemented');
  }

  joinThrough(tableContext) {
    throw new Error('not imeplemented');
  }
}

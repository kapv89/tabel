import {assign} from 'lodash';

import Relation from './Relation';
import MorphTo from './Relation';

export default class MorphOne extends Relation {
  constructor(ownerTable, toTable, inverse) {
    if (! (inverse instanceof MorphTo)) {
      throw new Error('inverse should be a MorphTo relation');
    }

    super(ownerTable);
    assign(this, {fromTable: ownerTable.fork(), toTable, inverse});
  }

  initRelation(fromModels) {
    return fromModels.map((m) => assign(m, {[this.relationName]: []}));
  }

  getRelated(...args) {
    if (args.length === 0) {
      if (this.activeModel !== null) {
        return this.getRelated([this.activeModel]).then(([relatedModel]) => relatedModel);
      } else {
        return Promise.resolve(null);
      }
    }

    const [fromModels] = args;
    const {fromTable, inverse} = this;
    const toTable = this.constraints.apply(this.toTable.fork());

    const {foreignKey, typeField} = inverse;
    const typeValue = fromTable.tableName();

    return toTable.where({[typeField]: typeValue})
      .whereIn(foreignKey, fromModels.map((m) => m[fromTable.key()]))
      .all()
    ;
  }

  matchModels(fromModels=[], relatedModels=[]) {
    const {relationName, fromTable, inverse} = this;
    const {foreignKey} = inverse;

    const keyDict = relatedModels.reduce((dict, m) => {
      return assign(dict, {[m[foreignKey]]: m});
    }, {});

    return fromModels.map((m) => assign(m, {
      [relationName]: keyDict[m[fromTable.key()]]
    }));
  }

  insert(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.insert(this.activeModel, ...args);
    }

    const [fromModel, values] = args;
    const {fromTable, toTable, inverse} = this;
    const {foreignKey, typeField} = inverse;

    return toTable.insert(assign(values, {
      [foreignKey]: fromModel[this.key],
      [typeField]: fromTable.tableName()
    }));
  }

  update(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.update(this.activeModel, ...args);
    }

    const [fromModel, values] = args;
    const {fromTable, toTable, inverse} = this;
    const {foreignKey, typeField} = inverse;

    return this.constraints.apply(toTable.fork())
      .where(typeField, fromTable.tableName())
      .where(foreignKey, fromModel[fromTable.key()])
      .update(assign(values, {
        [foreignKey]: fromModel[fromTable.key()],
        [typeField]: fromTable.tableName()
      }));
  }

  del(...args) {
    if (args.length === 0) {
      return this.del(this.activeModel);
    }

    const [fromModel] = args;
    const {fromTable, toTable, inverse} = this;
    const {foreignKey, typeField} = inverse;

    return this.constraints.apply(toTable.fork())
      .where(typeField, fromTable.tableName())
      .where(foreignKey, fromModel[fromTable.key()])
      .del()
    ;
  }

  join(joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {});
    const {fromTable, toTable, inverse} = this;
    const {foreignKey, typeField} = inverse;

    if (this.ownerTable.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.ownerTable.joint((q) => {
        q.join(toTable.tableName(), (j) => {
          j.on(toTable.c(typeField), '=', fromTable.orm.raw('?', [fromTable.tableName()]))
           .on(toTable.c(foreignKey), '=', fromTable.keyCol());

          joiner(j);
        });
      }, label);
    }
  }

  leftJoin(joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {isLeftJoin: true});
    const {fromTable, toTable, inverse} = this;
    const {foreignKey, typeField} = inverse;

    if (this.ownerTable.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.ownerTable.joint((q) => {
        q.leftJoin(toTable.tableName(), (j) => {
          j.on(toTable.c(typeField), '=', fromTable.orm.raw('?', [fromTable.tableName()]))
           .on(toTable.c(foreignKey), '=', fromTable.keyCol());

          joiner(j);
        });
      }, label);
    }
  }
}

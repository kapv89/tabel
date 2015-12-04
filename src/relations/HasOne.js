import {assign} from 'lodash';

import Relation from './Relation';

export default class HasOne extends Relation {
  constructor(fromTable, toTable, foreignKey, key) {
    super();
    assign(this, {fromTable, toTable, foreignKey, key});
  }

  initRelation(fromModels) {
    return fromModels.map((m) => assign(m, {[this.relationName]: null}));
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

    const {toTable, foreignKey, key} = this;

    return this.constraints.apply(toTable.fork())
      .whereIn(foreignKey, fromModels.map((m) => m[key]))
      .all()
    ;
  }

  matchModels(fromModels=[], relatedModels=[]) {
    const {relationName, foreignKey, key} = this;

    const keyDict = relatedModels.reduce((dict, m) => {
      return assign(dict, {[m[foreignKey]]: m});
    }, {});

    return fromModels.map((m) => assign(m, {
      [relationName]: keyDict[m[key]]
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

    return this.toTable.insert(assign(values, {[this.foreignKey]: fromModel[this.key]}));
  }

  update(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.update(this.activeModel, ...args);
    }

    const [fromModel, values] = args;

    return this.constraints.apply(this.toTable.fork())
      .where(this.foreignKey, fromModel[this.key])
      .update(assign(values, {[this.foreignKey]: fromModel[this.key]}))
    ;
  }

  del(...args) {
    if (args.length === 0) {
      return this.del(this.activeModel);
    }

    const [fromModel] = args;

    return this.constraints.apply(this.toTable.fork())
      .where(this.foreignKey, fromModel)
      .del()
    ;
  }

  join(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {});
    const {fromTable, toTable, foreignKey, key} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return tableContext.joint((q) => {
        q.join(toTable.tableName(), (j) => {
          j.on(toTable.c(foreignKey), '=', fromTable.c(key));
          joiner(j);
        });
      }, label);
    }
  }

  leftJoin(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {isLeftJoin: true});
    const {fromTable, toTable, foreignKey, key} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return tableContext.joint((q) => {
        q.leftJoin(toTable.tableName(), (j) => {
          j.on(toTable.c(foreignKey), '=', fromTable.c(key));
          joiner(j);
        });
      }, label);
    }
  }
}

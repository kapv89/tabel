import {assign} from 'lodash';

import Relation from './Relation';

export default class BelongsTo extends Relation {
  constructor(fromTable, toTable, foreignKey, otherKey) {
    super();
    assign(this, {fromTable, toTable, foreignKey, otherKey});
  }

  initRelation(fromModels=[]) {
    return fromModels.map((model) => assign(model, {[this.relationName]: null}));
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

    if (fromModels.length === 0) {
      return Promise.resolve([]);
    } else {
      const foreignKeys = fromModels.filter((m) => !!m).map((m) => m[this.foreignKey]);

      return this.constraints.apply(this.toTable.fork())
        .whereIn(this.otherKey, foreignKeys)
        .all()
      ;
    }
  }

  matchModels(fromModels=[], relatedModels=[]) {
    const keyDict = relatedModels.reduce(
      (dict, m) => assign(dict, {[m[this.otherKey]]: m}),
      {}
    );

    return fromModels.map((m) => assign(m, {[this.relationName]: keyDict[m[this.foreignKey]]}));
  }

  associate(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.associate(this.activeModel, ...args);
    }

    const [fromModel, toModel] = args;

    return this.fromTable.whereKey(fromModel).update({
      [this.foreignKey]: toModel[this.otherKey]
    });
  }

  dissociate(...args) {
    if (args.length === 0) {
      return this.dissociate(this.activeModel);
    }

    const [fromModel] = args;

    return this.fromTable.whereKey(fromModel).update({
      [this.foreignKey]: null
    });
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
      .where(this.otherKey, fromModel[this.foreignKey])
      .update(values);
  }

  del(...args) {
    if (args.length === 0) {
      return this.del(this.activeModel);
    }

    const [fromModel] = args;

    return this.constraints.apply(this.toTable.fork())
      .where(this.otherKey, fromModel[this.foreignKey])
      .del();
  }

  join(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {});
    const {fromTable, toTable, foreignKey, otherKey} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return tableContext.joint((q) => {
        q.join(toTable.tableName(), (j) => {
          j.on(fromTable.c(foreignKey), '=', toTable.c(otherKey));
          joiner(j);
        });
      }, label);
    }
  }

  leftJoin(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {isLeftJoin: true});
    const {fromTable, toTable, foreignKey, otherKey} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return tableContext.joint((q) => {
        q.leftJoin(toTable.tableName(), (j) => {
          j.on(fromTable.c(foreignKey), '=', toTable.c(otherKey));
          joiner(j);
        });
      }, label);
    }
  }
}

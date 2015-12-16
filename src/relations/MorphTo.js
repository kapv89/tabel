import {assign, isString} from 'lodash';

import Relation from './Relation';

export default class MorphTo extends Relation {
  constructor(ownerTable, toTables, typeField, foreignKey) {
    super(ownerTable);
    assign(this, {fromTable: ownerTable.fork(), toTables, typeField, foreignKey});
  }

  initRelation(fromModels=[]) {
    return fromModels.map((m) => assign(m, {[this.relationName]: null}));
  }

  getRelated(...args) {
    if (args.length === 0) {
      if (this.activeModel !== null) {
        return this.getRelated([this.activeModel])
          .then((results) => {
            return results
              .filter((r) => r.type === this.activeModel[this.typeField])
              .map(({models}) => models);
          })
          .then(([relatedModel]) => relatedModel);
      } else {
        return Promise.resolve(null);
      }
    }

    const [fromModels] = args;
    const {toTables, typeField, foreignKey} = this;

    if (fromModels.length === 0) {
      return Promise.resolve([]);
    } else {
      return Promise.all(toTables.map((table) => {
        const fromKeys = fromModels
          .filter((m) => m[typeField] === table.tableName())
          .map((m) => m[foreignKey])
        ;

        return this.constraints.apply(table.fork())
          .whereIn(table.key(), fromKeys).all()
          .then((models) => ({type: table.tableName(), models}));
      }));
    }
  }

  matchModels(fromModels=[], relatedModels=[]) {
    const {relationName, toTables, typeField, foreignKey} = this;

    const tableKeyDict = relatedModels.reduce((dict, {type, models}) => {
      const table = toTables.filter((t) => t.tableName() === type)[0];

      return assign(dict, {
        [type]: models.reduce((keyDict, model) => {
          return assign(keyDict, {[model[table.key()]]: model});
        }, {})
      });
    }, {});

    return fromModels.map((m) => {
      if (m[typeField] in tableKeyDict && m[foreignKey] in tableKeyDict[m[typeField]]) {
        return assign(m, {
          [relationName]: tableKeyDict[m[typeField]][m[foreignKey]]
        });
      } else {
        return assign(m, {[relationName]: null});
      }
    });
  }

  associate(...args) {
    if (args.length < 2) {
      throw new Error('bad method call');
    }

    if (args.length === 2) {
      return this.associate(this.activeModel, ...args);
    }

    const [fromModel, relatedModel, tableName] = args;
    const table = this.toTables.filter((t) => t.tableName() === tableName)[0];

    return this.fromTable.fork().whereKey(fromModel).update({
      [this.typeField]: tableName,
      [this.foreignKey]: relatedModel[table.key()]
    });
  }

  dissociate(...args) {
    if (args.length === 0) {
      return this.dissociate(this.activeModel);
    }

    const [fromModel] = args;

    return this.fromTable.fork().whereKey(fromModel).update({
      [this.typeField]: null,
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
    const table = this.toTables.filter((t) => t.tableName() === fromModel[this.typeField])[0];

    return this.constraints.apply(table.fork())
      .whereKey(fromModel[this.foreignKey])
      .update(values)
    ;
  }

  del(...args) {
    if (args.length === 0) {
      return this.del(this.activeModel);
    }

    const [fromModel] = args;
    const table = this.toTables.filter((t) => t.tableName() === fromModel[this.typeField])[0];

    return this.constraints.apply(table.fork())
      .whereKey(fromModel[this.foreignKey])
      .del()
    ;
  }

  join(tableName, joiner=(() => {}), label=null) {
    if (this.toTables.map((t) => t.tableName()).indexOf(tableName) === -1) {
      return this.ownerTable;
    }

    label = this.jointLabel(`${tableName}${isString(label) ? `.${label}` : ''}`, {});
    const toTable = this.toTables.filter((t) => t.tableName() === tableName)[0];
    const {fromTable, typeField, foreignKey} = this;

    if (this.ownerTable.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.ownerTable.joint((q) => {
        q.join(toTable.tableName(), (j) => {
          j.on(fromTable.c(typeField), '=', toTable.raw('?', [toTable.tableName()]))
           .on(fromTable.c(foreignKey), '=', toTable.keyCol());

          joiner(j);
        });
      });
    }
  }

  leftJoin(tableName, joiner=(() => {}), label=null) {
    if (this.toTables.map((t) => t.tableName()).indexOf(tableName) === -1) {
      return this.ownerTable;
    }

    label = this.jointLabel(`${tableName}${isString(label) ? `.${label}` : ''}`, {
      isLeftJoin: true
    });
    const toTable = this.toTables.filter((t) => t.tableName() === tableName)[0];
    const {fromTable, typeField, foreignKey} = this;

    if (this.ownerTable.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.ownerTable.joint((q) => {
        q.leftJoin(toTable.tableName(), (j) => {
          j.on(fromTable.c(typeField), '=', toTable.raw('?', [toTable.tableName()]))
           .on(fromTable.c(foreignKey), '=', toTable.keyCol());

          joiner(j);
        });
      });
    }
  }
}

import {assign} from 'lodash';

import Relation from './Relation';

export default class MorphTo extends Relation {
  constructor(fromTable, toTables, typeField, foreignKey) {
    super();
    assign(this, {fromTable, toTables, typeField, foreignKey});
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
      const table = toTables.filter((t) => t.tableName === type)[0];

      return assign(dict, {
        type: models.reduce((keyDict, model) => {
          return assign({[model[table.key()]]: model});
        }, {})
      });
    }, {});

    return fromModels.map((m) => {
      if (m[typeField] in tableKeyDict && m[foreignKey] in tableKeyDict[m[typeField]]) {
        return assign(m, {[relationName]: tableKeyDict[m[typeField]][m[foreignKey]]});
      } else {
        return m;
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
    const table = this.toTables.filter((t) => t.tableName === fromModel[this.typeField])[0];

    return this.constraints.apply(table.fork())
      .whereKey(fromModel[this.foreignKey])
      .del()
    ;
  }
}

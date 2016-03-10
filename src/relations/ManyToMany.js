import {assign, isArray} from 'lodash';
import isUsableObject from 'isusableobject';

import Relation from './Relation';

export default class ManyToMany extends Relation {
  constructor(ownerTable, toTable, pivotTable, foreignKey, otherKey, joiner=(() =>{})) {
    super(ownerTable);
    assign(this, {fromTable: ownerTable.fork(), toTable, pivotTable, foreignKey, otherKey});

    this.pivotFields = [foreignKey, otherKey];

    this.constrain((t) => {
      t.scope((q) => q.join(this.pivotTable.tableName(), (j) => {
        j.on(this.pivotTable.c(this.otherKey), '=', toTable.keyCol());
        joiner(j);
      }));
    });
  }

  withPivot(...pivotFields) {
    this.pivotFields = pivotFields.concat([this.foreignKey, this.otherKey]);
    return this;
  }

  initRelation(fromModels=[]) {
    return fromModels.map((model) => assign(model, {[this.relationName]: []}));
  }

  getRelated(...args) {
    if (args.length === 0) {
      if (this.activeModel !== null) {
        return this.getRelated([this.activeModel]);
      } else {
        return Promise.resolve([]);
      }
    }

    const [fromModels] = args;

    const {fromTable, pivotTable, foreignKey} = this;
    const toTable = this.constraints.apply(this.toTable.fork());

    const fromKeys = fromModels.map((m) => m[fromTable.key()]);

    const cols = ['*'].concat(this.pivotFields.map((field) => {
      return `${pivotTable.c(field)} as ${pivotTable.tableName()}__${field}`;
    }));

    return toTable.whereIn(pivotTable.c(foreignKey), fromKeys)
      .select(...cols).all().then((relatedModels) => {
        return relatedModels.map((model) => {
          const pivot = Object.keys(model)
            .filter((field) => field.indexOf(`${pivotTable.tableName()}__`) > -1)
            .reduce((pivotModel, field) => {
              const strippedField = field.slice(`${pivotTable.tableName()}__`.length);
              return assign({}, pivotModel, {[strippedField]: model[field]});
            }, {})
          ;

          return assign(
            Object.keys(model)
              .filter((field) => field.indexOf(`${pivotTable.tableName()}__`) === -1)
              .reduce((modelWithoutPivots, field) => {
                return assign({}, modelWithoutPivots, {[field]: model[field]});
              }, {}),
            {pivot}
          );
        });
      })
    ;
  }

  matchModels(fromModels=[], relatedModels=[]) {
    const {relationName, foreignKey, fromTable} = this;

    const keyDict = relatedModels.reduce((dict, m) => {
      const key = m.pivot[foreignKey];

      if (! isArray(dict[key])) {
        return assign(dict, {[key]: [m]});
      } else {
        return assign(dict, {[key]: dict[key].concat([m])});
      }
    }, {});

    return fromModels.map((m) => assign(m, {
      [relationName]: isArray(keyDict[m[fromTable.key()]]) ? keyDict[m[fromTable.key()]] : []
    }));
  }

  sync(...args) {
    // if args length is 1 that means we have only values
    // if args length is 2 and fromModel is an
    // array, that means fromModel has not been provided.
    // if args length is 3 that means we have all 3 args
    if (args.length === 1) {
      return this.sync(this.activeModel, args[0], {});
    }

    if (args.length === 2) {
      if (isArray(args[0])) {
        return this.sync(this.activeModel, ...args);
      } else if (isArray(args[1])) {
        return this.sync(args[0], args[1], {});
      } else {
        throw new Error('bad method call');
      }
    }

    const {fromTable, pivotTable, toTable, foreignKey, otherKey} = this;
    const [fromModel, relatedModels, extraFields] = args;

    return pivotTable.fork()
      .where(foreignKey, fromModel[fromTable.key()])
      .del()
      .then(() => {
        if (relatedModels.length === 0) {
          return Promise.resolve([]);
        }

        const relatedKeys = relatedModels.map((m) => isUsableObject(m) ? m[toTable.key()] : m);
        const fromKey = fromModel[fromTable.key()];

        const pivots = relatedKeys.map((k) => {
          return assign({}, extraFields, {
            [foreignKey]: fromKey,
            [otherKey]: k
          });
        });

        return pivotTable.insert(pivots);
      })
    ;
  }

  attach(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.attach(this.activeModel, args[0], {});
    }

    if (args.length === 2) {
      return this.attach(this.activeModel, ...args);
    }

    const [fromModel, relatedModel, extraFields] = args;

    if (isArray(relatedModel)) {
      return Promise.all(relatedModel.map((m) => this.attach(fromModel, m, extraFields)));
    }

    const {fromTable, pivotTable, toTable, foreignKey, otherKey} = this;

    const pivot = {
      [foreignKey]: fromModel[fromTable.key()],
      [otherKey]: relatedModel[toTable.key()]
    };

    return pivotTable.insert(assign({}, extraFields, pivot));
  }

  detach(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.detach(this.activeModel, args[0]);
    }

    if (args.length === 2) {
      return this.detach(this.activeModel, ...args);
    }

    const [fromModel, relatedModel] = args;
    const {fromTable, pivotTable, toTable, foreignKey, otherKey} = this;

    if (isArray(relatedModel)) {
      return Promise.all(relatedModel.map((m) => this.detach(fromModel, m)));
    } else {
      return pivotTable.fork().where({
        [foreignKey]: fromModel[fromTable.key()],
        [otherKey]: relatedModel[toTable.key()]
      }).del();
    }
  }

  insert(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.insert(this.activeModel, ...args);
    }

    const {fromTable, pivotTable, toTable, foreignKey, otherKey} = this;
    const [fromModel, values] = args;

    return toTable.insert(values).then((relatedModel) => {
      const newPivots = (() => {
        if (isArray(relatedModel)) {
          return relatedModel.map((m) => {
            const pivotFields = {
              [foreignKey]: fromModel[fromTable.key()],
              [otherKey]: m[toTable.key()]
            };

            if ('pivot' in m) {
              return assign({}, pivotFields, m.pivot);
            } else {
              return pivotFields;
            }
          });
        } else {
          const pivotFields = {
            [foreignKey]: fromModel[fromTable.key()],
            [otherKey]: relatedModel[toTable.key()]
          };

          if ('pivot' in relatedModel) {
            return assign({}, pivotFields, relatedModel.pivot);
          } else {
            return pivotFields;
          }
        }
      })();

      return pivotTable.insert(newPivots);
    });
  }

  update(...args) {
    if (args.length === 0) {
      throw new Error('bad method call');
    }

    if (args.length === 1) {
      return this.update(this.activeModel, ...args);
    }

    const {fromTable, pivotTable, foreignKey, otherKey} = this;
    const toTable = this.constraints.apply(this.toTable.fork());
    const [fromModel, values] = args;

    if (isArray(values)) {
      return Promise.all(values.map((v) => this.update(fromModel, v)));
    } else {
      if ('pivot' in values) {
        const pivotCondition = {
          [foreignKey]: fromModel[fromTable.key()],
          [otherKey]: values[toTable.key()]
        };

        return Promise.all([
          pivotTable.fork().where(pivotCondition).update(values.pivot),
          toTable.fork().whereKey(values).update(values)
        ]);
      } else {
        return toTable.fork().whereKey(values).update(values);
      }
    }
  }

  del(...args) {
    if (args.length === 0) {
      return this.del(this.activeModel);
    }

    const {fromTable, pivotTable, toTable, foreignKey} = this;
    const [fromModel] = args;

    return this.constraints.apply(toTable.fork())
      .where(pivotTable.c(foreignKey), fromModel[fromTable.key()])
      .del().then(() => {
        return pivotTable.fork()
          .where(foreignKey, fromModel[fromTable.key()])
          .del();
      })
    ;
  }

  join(joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {});
    const {pivotTable, toTable, otherKey} = this;

    if (this.ownerTable.scopeTrack.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.joinPivot().joint((q) => {
        q.join(toTable.tableName(), (j) => {
          j.on(toTable.keyCol(), '=', pivotTable.c(otherKey));
          joiner(j);
        });
      });
    }
  }

  joinPivot(joiner=(() => {}), label=null) {
    label = this.pivotJointLabel(label, {});
    const {pivotTable, fromTable, foreignKey} = this;

    if (this.ownerTable.scopeTrack.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.ownerTable.joint((q) => {
        q.join(pivotTable.tableName(), (j) => {
          j.on(fromTable.keyCol(), '=', pivotTable.c(foreignKey));
          joiner(j);
        });
      }, label);
    }
  }

  leftJoin(joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {isLeftJoin: true});
    const {pivotTable, toTable, otherKey} = this;

    if (this.ownerTable.scopeTrack.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.leftJoinPivot().joint((q) => {
        q.leftJoin(toTable.tableName(), (j) => {
          j.on(toTable.keyCol(), '=', pivotTable.c(otherKey));
          joiner(j);
        });
      });
    }
  }

  leftJoinPivot(joiner=(() => {}), label=null) {
    label = this.pivotJointLabel(label, {isLeftJoin: true});
    const {pivotTable, fromTable, foreignKey} = this;

    if (this.ownerTable.scopeTrack.hasJoint(label)) {
      return this.ownerTable;
    } else {
      return this.ownerTable.joint((q) => {
        q.leftJoin(pivotTable.tableName(), (j) => {
          j.on(fromTable.keyCol(), '=', pivotTable.c(foreignKey));
          joiner(j);
        });
      }, label);
    }
  }
}

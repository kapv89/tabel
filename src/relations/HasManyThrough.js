import {assign, isArray} from 'lodash';

import Relation from './Relation';

export default class HasManyThrough extends Relation {
  constructor(fromTable, toTable, throughTable, firstKey, secondKey) {
    super();
    assign(this, {fromTable, toTable, throughTable, firstKey, secondKey});

    this.throughFields = [firstKey, secondKey];

    this.constrain((t) => {
      t.scope((q) => {
        q.join(throughTable.tableName(), throughTable.key(), '=', toTable.c(secondKey));
      });
    });
  }

  withThrough(...throughFields) {
    this.throughFields = throughFields.concat([this.firstKey, this.secondKey]);
    return this;
  }

  initRelation(fromModels) {
    return fromModels.map((m) => assign(m, {[this.relationName]: []}));
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

    const {fromTable, throughTable, firstKey} = this;
    const toTable = this.constraints.apply(this.toTable.fork());

    const fromKeys = fromModels.map((m) => m[fromTable.key()]);

    const cols = ['*'].concat(this.throughFields.map((field) => {
      return `${throughTable.c(field)} as ${throughTable.tableName()}__${field}`;
    }));

    return toTable.whereIn(throughTable.c(firstKey), fromKeys)
      .select(cols).all().then((relatedModels) => {
        return relatedModels.map((model) => {
          const through = Object.keys(model)
            .filter((field) => field.indexOf(`${throughTable.tableName()}__`) > -1)
            .reduce((throughModel, field) => {
              const strippedField = field.slice(`${throughTable.tableName()}__`.length);
              return assign({}, throughModel, {[strippedField]: model[field]});
            }, {})
          ;

          return assign(
            Object.keys(model)
              .filter((field) => field.indexOf(`${throughTable.tableName()}__`) === -1)
              .reduce((modelWithoutThroughs, field) => {
                return assign({}, modelWithoutThroughs, {[field]: model[field]});
              }, {}),
            {through}
          );
        });
      });
  }

  matchModels(fromModels=[], relatedModels=[]) {
    const {relationName, firstKey, fromTable} = this;

    const keyDict = relatedModels.reduce((dict, m) => {
      const key = m.through[firstKey];

      if (! isArray(dict[key])) {
        return assign(dict, {[key]: [m]});
      } else {
        return assign(dict, {[key]: dict[key].concat([m])});
      }
    }, {});

    return fromModels.map((m) => assign(m, {
      [relationName]: keyDict[m[fromTable.key()]]
    }));
  }

  join(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {});
    const {throughTable, toTable, secondKey} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return this.joinThrough(tableContext).joint((q) => {
        q.join(toTable.tableName(), (j) => {
          j.on(throughTable.keyCol(), '=', toTable.c(secondKey));
          joiner(j);
        });
      }, label);
    }
  }

  joinThrough(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {});
    const {fromTable, throughTable, firstKey} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return tableContext.joint((q) => {
        q.join(throughTable.tableName(), (j) => {
          j.on(fromTable.keyCol(), '=', throughTable.c(firstKey));
        });
      }, label);
    }
  }

  leftJoin(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {isLeftJoin: true});
    const {throughTable, toTable, secondKey} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return this.leftJoinThrough(tableContext).joint((q) => {
        q.leftJoin(toTable.tableName(), (j) => {
          j.on(throughTable.keyCol(), '=', toTable.c(secondKey));
          joiner(j);
        });
      }, label);
    }
  }

  leftJoinThrough(tableContext, joiner=(() => {}), label=null) {
    label = this.jointLabel(label, {isLeftJoin: true});
    const {fromTable, throughTable, firstKey} = this;

    if (tableContext.hasJoint(label)) {
      return tableContext;
    } else {
      return tableContext.joint((q) => {
        q.leftJoin(throughTable.tableName(), (j) => {
          j.on(fromTable.keyCol(), '=', throughTable.c(firstKey));
        });
      }, label);
    }
  }
}

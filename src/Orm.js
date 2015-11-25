import knex from 'knex';
import KRedis from 'kredis';
import {merge} from 'lodash';

import Table from './Table';
import Scope from './Scope';
import Track from './Track';

export default class Orm {
  constructor(config) {
    if ('db' in config) {
      this.knex = knex(config.db);
    } else {
      throw new Error('no `db` config found');
    }

    if ('redis' in config) {
      this.redis = new KRedis(config.redis);
    }

    // tables definitions
    this.tableClasses = new Map();

    // tables instances
    this.tables = new Map();
  }

  // raw expr helper
  raw(expr) {
    return knex.raw(expr);
  }

  // transaction helper
  transaction(promiseFn) {
    return this.knex.transaction(promiseFn);
  }

  // transaction shorthand
  // usage:
  // return orm.trx((t) => {
  //   return orm('users', t).save([{}, {}, {}]);
  // }).then((users) => {
  //    ...
  // });
  trx(promiseFn) {
    let outerResult;

    return this.transaction((t) => {
      return promiseFn(t).then((result) => {
        return t.commit().then(() => {
          outerResult = result;
          return result;
        });
      }).catch((e) => {
        t.rollback();
        throw e;
      });
    }).then(() => outerResult);
  }

  // method to close the database
  close() {
    const promises = [this.knex.destroy];

    if (this.redis) {
      promises.push(this.redis.quit());
    }

    return Promise.all(promises);
  }

  // here, we load the columns of all the tables that have been
  // defined via the orm, and return a promise on completion
  // cos, if people wanna do that before starting the server
  // let em do that
  load() {
    return Promise.all(
      Array.from(this.tables.keys).map((name) => this.tableClass(name).load())
    );
  }

  // get a tableClass
  tableClass(tableName) {
    return this.tableClasses.get(tableName);
  }

  // get a table object
  table(tableName) {
    return this.tables.get(tableName).fork();
  }

  // shorthand for table
  tbl(tableName) {
    return this.table(tableName);
  }

  defineTable(tableName, params) {
    if (this.tableClasses.has(tableName)) {
      throw new Error(`Table '${tableName}' already defined`);
    }

    this.tableClasses.set(tableName, this.newTableClass(tableName, params));
    this.instantitateTable(tableName, params);
    return this;
  }

  extendTable(tableName, params) {
    if (! this.tableClasses.has(tableName)) {
      throw new Error(`Table '${tableName}' not defined yet`);
    }

    const ExtendedTableClass = this.extendTableClass(this.tableClasses.get(tableName), params);
    this.tableClasses.set(tableName, ExtendedTableClass);
    this.instantitateTable(tableName, params);
    return this;
  }

  instantitateTable(tableName, params) {
    return this.tables.set(tableName, new this.tableClasses.get(tableName)(params));
  }

  newTableClass(tableName, params) {
    const TableClass = ((orm) => class extends Table {
      constructor() {
        super(orm, tableName);
      }
    });

    return this.extendTableClass(TableClass, params);
  }

  extendTableClass(TableClass, params) {
    const {props, processors, scopes, joints, relations, methods} = merge(
      // the defaults
      {},
      // supplied paramss
      params
    );

    const ExtendedTableClass = class extends TableClass {};

    ExtendedTableClass.prototype.props = props;
    ExtendedTableClass.prototype.processors = processors;

    merge(
      ExtendedTableClass.prototype,
      Object.keys(scopes).reduce((processed, name) => {
        return merge(processed, {
          [name](...args) {
            scopes[name].apply(this, args);
            // set the label of the last pushed scope
            this.scopeTrack.relabelLastScope(name);
            return this;
          }
        });
      }, {})
    );

    merge(
      ExtendedTableClass.prototype,
      Object.keys(scopes).reduce((processed, name) => {
        // predefined joints never take arguments
        return merge(processed, {
          [name]() {
            if (this.scopeTrack.hasJoint(name)) {
              return this;
            } else {
              joints[name].call(this);
              // set the label of the last pushed scope
              this.scopeTrack.relabelLastScope(name);
              // ensure that the last scope is a joint
              this.scopeTrack.convertLastScopeToJoint();
              return this;
            }
          }
        });
      }, {})
    );

    merge(
      ExtendedTableClass.prototype,
      Object.keys(relations).reduce((processed, name) => {
        // const relation = relations[name];
        return merge(processed, {
          [name](model) {
            if (model) {
              return relations[name].bind(this)().withModel(model);
            } else {
              return relations[name].bind(this)();
            }
          }
        });
      }, {})
    );

    merge(
      ExtendedTableClass.prototype,
      Object.keys(relations).reduce((processed, name) => {
        return merge(processed, {[name]: methods[name]});
      }, {})
    );

    return ExtendedTableClass;
  }
}

/*
{
  // the table's name, is required
  name: null,

  // table properties
  props: {
    key: 'id',
    // default key column, can be ['user_id', 'post_id'] for composite keys
    autoId: false,
    // by default we don't assume that you use an auto generated db id
    perPage: 25,
    // standard batch size per page used by `forPage` method
    // forPage method uses offset
    // avoid that and use a keyset in prod (http://use-the-index-luke.com/no-offset)
    timestamps: false
    // set to `true` if you want auto timestamps or
    // timestamps: ['created_at', 'updated_at'] (these are defaults when `true`)
    // will be assigned in this order only
  },

  // used to process model and collection results fetched from the db
  // override as you need to
  processors: {
    model(row) { return row; },
    collection(rows) { return rows; }
  },

  // predefined scopes on the table
  scopes: {},
  // predefined joints on the table
  joints: {},
  // relations definitions for the table
  relations: {},
  // table methods defintions
  methods: {}
}
*/

import md5 from 'md5';
import uuid from 'uuid';
import {
  isArray,
  isString,
  isDate,
  isNumber,
  assign,
  merge,
  toPlainObject
} from 'lodash';

import isUsableObject from './isUsableObject';
import Scope from './Scope';
import Track from './Track';

import HasOne from './relations/HasOne';
import HasMany from './relations/HasMany';
import HasManyThrough from './relations/HasManyThrough';
import BelongsTo from './relations/BelongsTo';
import BelongsToMany from './relations/BelongsToMany';
import MorphOne from './relations/MorphOne';
import MorphMany from './relations/MorphMany';
import MorphTo from './relations/MorphTo';

export default class Table {
  constructor(orm) {
    this.orm = orm;
    this.scopeTrack = new Track();

    if (this.orm.cache) {
      this.cache = this.orm.cache.hash(this.tableName());
    }
  }

  /**
   * get the tablename
   * @return {string} the tableName
   */
  tableName() {
    return this.name;
  }

  /**
   * knex.raw helper
   * @param  {string} expr     raw expression
   * @param  {Array}  bindings bindings for the expression
   * @return {knex.raw}        raw expr
   */
  raw(expr, bindings=[]) {
    return this.orm.raw(expr, bindings);
  }

  /**
   * just return a raw knex query for this table
   * @return {knex.query} a fresh knex query for table
   */
  rawQuery() {
    return this.orm.knex(this.tableName());
  }

  /**
   * get a new query instance for this table, with a few flags
   * set on the query object used by the orm
   * @return {knex.query} a fresh knex query for table with orm flags
   */
  newQuery() {
    return this.attachOrmNSToQuery(
      this.orm.knex(this.tableName())
    );
  }

  /**
   * attach _orm to knex query with required flags
   * @param  {knex.query} q knex query
   * @return {knex.query} query with namespace
   */
  attachOrmNSToQuery(q) {
    q._orm = {
      // used by cache processor
      cacheEnabled: false,
      cacheLifetime: null,
      destroyCache: false,

      // used to select columns and all
      columns: this.c('*'),

      // transaction being used on the query
      trx: null,

      // relations to be eagerloaded on the query
      eagerLoads: {}
    };

    return q;
  }

  /**
   * get a fully scoped query, with flags for whether this is a count query or not.
   * the counting function sets columns it counts on smartly
   * @return {knex.query} table's query object with scopeTrack applied
   */
  query(opts={}) {
    const q = this.newQuery();

    // apply the scopeTrack on the query
    this.scopeTrack.apply(q);

    if (opts.count === true) {
      return q;
    } else {
      return q.select(q._orm.columns);
    }
  }

  /**
   * load columns of the table
   * @return {Promise} a promise which resolves when table columns have loaded
   */
  load() {
    return this.newQuery().columnInfo().then((columns) => {
      this.orm.tableColumns.set(this.tableName(), columns);
      return this;
    });
  }

  /**
   * get a promise of columns in the table
   * @return {Promise} promise containing array of table's columnNames
   */
  columns() {
    if (this.orm.tableColumns.has(this.tableName())) {
      return Promise.resolve(
        Object.keys(this.orm.tableColumns.get(this.tableName()))
      );
    } else {
      return this.load().then(() => this.columns());
    }
  }

  /**
   * qualified column name helper
   * @param  {mixed} col column or [columns]
   * @return {mixed} qualified column name(s)
   */
  c(col) {
    if (isArray(col)) {
      return col.map((c) => this.c(c));
    } else if (isString(col)) {
      col = col.indexOf('.') > -1 ? col : `${this.tableName()}.${col}`;
    }

    return col;
  }

  /**
   * get the key of the table
   * @return {mixed} get the key property
   */
  key() {
    return this.props.key;
  }

  /**
   * qualified column of key(s)
   * @return {mixed} qualified key column(s)
   */
  keyCol() {
    return this.c(this.key());
  }

  /**
   * chain new scopes to the table's scopeTrack
   * @param  {function} closure op to be applied on the query
   * @param  {string} label label of the scope, optional
   * @return {this} current instance
   */
  scope(closure, label='scope') {
    this.scopeTrack.push(new Scope(closure, label));
    return this;
  }

  /**
   * chain a new joint to the table's scopeTrack.
   * will be run only once, if another with same label has run before
   * @param  {function} closure op to be applied on the query
   * @param  {string} label  label of the joint, optional
   * @return {this} current instance
   */
  joint(closure, label='joint') {
    this.scopeTrack.push(new Scope(closure, label, true));
    return this;
  }

  /**
   * fork the table and its scopes so that different scopes can be applied
   * to both instances further
   * @return {this.constructor} forked table instance
   */
  fork() {
    const forkedTable = new this.constructor(this.orm);
    forkedTable.scopeTrack = this.scopeTrack.fork();

    return forkedTable;
  }

  /**
   * helper to refer to other tables. carries over transaction
   * and cache settings
   * @param  {string} tableName name of table you want
   * @return {Table} table instance for tableName
   */
  table(tableName) {
    const q = this.query();

    const tbl = this.orm.table(tableName);

    if (q._orm.trx !== null) {
      tbl.transacting(q._orm.trx);
    }

    if (q._orm.cacheEnabled) {
      tbl.cache(q._orm.cacheLifetime);
    }

    if (q._orm.destroyCache) {
      tbl.uncache();
    }

    return tbl;
  }

  /**
   * shorthand for table
   * @param  {string} tableName name of table you want
   * @return {Table} table instance for tableName
   */
  tbl(tableName) {
    return this.table(tableName);
  }

  /**
   * don't scope any rows
   * @return {this} current instance
   */
  whereFalse() {
    return this.scope((q) => q.whereRaw('?', [false]), 'whereFalse');
  }

  /**
   * apply a where condition on the key(s) with scopes as planned
   * @param  {mixed} val value(s) to match the key(s) against
   * @return {this} current instance
   *
   * whereKey(1)
   * whereKey({id: 1})
   * whereKey({post_id: 1, tag_id: 2})
   * whereKey([1,2,3,4]);
   * whereKey([{post_id: 1, tag_id: 2}, {post_id: 1, tag_id:2}])
   */
  whereKey(val) {
    if (isArray(val)) {
      return this.whereIn(this.key(), val);
    } else {
      if (isArray(this.key())) {
        if (isUsableObject(val)) {
          val = toPlainObject(val);
          return this.where(this.key().reduce((conditions, k) => {
            return assign(conditions, {[k]: val[k]});
          }, {}));
        } else {
          return this.where(this.key().reduce((conditions, k) => {
            return assign(conditions, {[k]: val});
          }, {}));
        }
      } else {
        return this.where({[this.key()]: val});
      }
    }
  }

  /**
   * apply an orWhere condition on the key(s) with scopes as planned
   * @param  {mixed} val value(s) to match the key(s) against
   * @return {this} current instance
   *
   * orWhereKey(1)
   * orWhereKey({id: 1})
   * orWhereKey({post_id: 1, tag_id: 2})
   * orWhereKey([1,2,3,4]);
   * orWhereKey([{post_id: 1, tag_id: 2}, {post_id: 1, tag_id:2}])
   */
  orWhereKey(val) {
    if (isArray(val)) {
      return this.orWhereIn(this.key(), val);
    } else {
      if (isArray(this.key())) {
        if (isUsableObject(val)) {
          val = toPlainObject(val);
          return this.orWhere(this.key().reduce((conditions, k) => {
            return assign(conditions, {[k]: val[k]});
          }, {}));
        } else {
          return this.orWhere(this.key().reduce((conditions, k) => {
            return assign(conditions, {[k]: val});
          }, {}));
        }
      } else {
        return this.orWhere({[this.key()]: val});
      }
    }
  }

  /**
   * scope a where condition
   * @param  {mixed} args conditions
   * @return {this} current instance
   */
  where(...args) {
    if (args.length === 1 && isUsableObject(args[0])) {
      const conditions = toPlainObject(args[0]);

      return Object.keys(conditions).reduce(
        (table, field) => table.where(field, '=', conditions[field]),
        this
      );
    }

    if (args.length === 2) {
      const [field, val] = args;
      return this.where(field, '=', val);
    }

    if (args.length === 3) {
      const [field, op, val] = args;

      switch (op.toLowerCase()) {
        case 'in': return this.whereIn(field, val);
        case 'not in': return this.whereNotIn(field, val);
        case 'between': return this.whereBetween(field, val);
        case 'not between': return this.whereNotBetween(field, val);
        default: return this.scope((q) => q.where(this.c(field), op, val), 'where');
      }
    }

    return this;
  }

  /**
   * scope an orWhere condition
   * @param  {mixed} args conditions
   * @return {this} current instance
   */
  orWhere(...args) {
    if (args.length === 1 && isUsableObject(args[0])) {
      const conditions = toPlainObject(args[0]);

      return Object.keys(conditions).reduce(
        (table, field) => table.orWhere(field, '=', conditions[field]),
        this
      );
    }

    if (args.length === 2) {
      const [field, val] = args;
      return this.where(field, '=', val);
    }

    if (args.length === 3) {
      const [field, op, val] = args;

      switch (op.toLowerCase()) {
        case 'in': return this.orWhereIn(field, val);
        case 'not in': return this.orWhereNotIn(field, val);
        case 'between': return this.orWhereBetween(field, val);
        case 'not between': return this.orWhereNotBetween(field, val);
        default: return this.scope((q) => q.orWhere(this.c(field), op, val), 'orWhere');
      }
    }

    return this;
  }

  /**
   * scope a whereNot condition
   * @param  {mixed} args conditions
   * @return {this} current instance
   */
  whereNot(...args) {
    if (args.length === 1 && isUsableObject(args[0])) {
      const conditions = toPlainObject(args[0]);

      return Object.keys(conditions).reduce(
        (table, field) => table.whereNot(field, '=', conditions[field]),
        this
      );
    }

    if (args.length === 2) {
      const [field, val] = args;
      return this.whereNot(field, '=', val);
    }

    if (args.length === 3) {
      const [field, op, val] = args;

      switch (op.toLowerCase()) {
        case 'in': return this.whereNotIn(field, val);
        case 'not in': return this.whereIn(field, val);
        case 'between': return this.whereNotBetween(field, val);
        case 'not between': return this.whereBetween(field, val);
        default: return this.scope((q) => q.whereNot(this.c(field), op, val), 'where');
      }
    }

    return this;
  }

  /**
   * scope an orWhereNot condition
   * @param  {mixed} args conditions
   * @return {this} current instance
   */
  orWhereNot(...args) {
    if (args.length === 1 && isUsableObject(args[0])) {
      const conditions = toPlainObject(args[0]);

      return Object.keys(conditions).reduce(
        (table, field) => table.orWhereNot(field, '=', conditions[field]),
        this
      );
    }

    if (args.length === 2) {
      const [field, val] = args;
      return this.orWhereNot(field, '=', val);
    }

    if (args.length === 3) {
      const [field, op, val] = args;

      switch (op.toLowerCase()) {
        case 'in': return this.orWhereNotIn(field, val);
        case 'not in': return this.orWhereIn(field, val);
        case 'between': return this.orWereNotBetween(field, val);
        case 'not between': return this.orWhereBetween(field, val);
        default: return this.scope((q) => q.orWhereNot(this.c(field), op, val), 'orWhere');
      }
    }

    return this;
  }

  /**
   * scope a whereIn condition
   * @param  {string} field field name
   * @param  {[mixed]} vals values to match against
   * @return {this} current instance
   *
   * whereIn('id', [1,2,3,4])
   * whereIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
   */
  whereIn(field, vals=[]) {
    if (vals.length === 0) {
      return this.whereFalse();
    } else {
      if (isArray(field)) {
        return this.whereRaw(
          `(${this.c(field)}) in (${vals.map(() => `(${field.map(() => '?')})`)})`,
          vals.map((v) => field.map((f) => v[f])).reduce((all, item) => all.concat(item), [])
        );
      } else {
        return this.scope((q) => q.whereIn(this.c(field), vals), 'whereIn');
      }
    }
  }

  /**
   * scope an orWhereIn condition
   * @param  {string} field field name
   * @param  {[mixed]} vals values to match against
   * @return {this} current instance
   *
   * orWhereIn('id', [1,2,3,4])
   * orWhereIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
   *
   */
  orWhereIn(field, vals=[]) {
    if (vals.length === 0) {
      return this;
    } else {
      if (isArray(field)) {
        return this.orWhereRaw(
          `(${this.c(field)}) in (${vals.map(() => `(${field.map(() => '?')})`)})`,
          vals.map((v) => field.map((f) => v[f])).reduce((all, item) => all.concat(item), [])
        );
      } else {
        return this.scope((q) => q.orWhereIn(this.c(field), vals), 'orWhereIn');
      }
    }
  }

  /**
   * scope a whereNotIn condition
   * @param  {string} field field name
   * @param  {[mixed]} vals values to match against
   * @return {this} current instance
   */
  whereNotIn(field, vals=[]) {
    if (vals.length === 0) {
      return this;
    } else {
      if (isArray(field)) {
        return this.whereRaw(
          `(${this.c(field)}) not in (${vals.map(() => `(${field.map(() => '?')})`)})`,
          vals.map((v) => field.map((f) => v[f])).reduce((all, item) => all.concat(item), [])
        );
      } else {
        return this.scope((q) => q.whereNotIn(this.c(field), vals), 'whereNotIn');
      }
    }
  }

  /**
   * scope a whereNotIn condition
   * @param  {string} field field name
   * @param  {[mixed]} vals values to match against
   * @return {this} current instance
   */
  orWhereNotIn(field, vals=[]) {
    if (vals.length === 0) {
      return this;
    } else {
      if (isArray(field)) {
        return this.orWhereRaw(
          `(${this.c(field)}) not in (${vals.map(() => `(${field.map(() => '?')})`)})`,
          vals.map((v) => field.map((f) => v[f])).reduce((all, item) => all.concat(item), [])
        );
      } else {
        return this.scope((q) => q.orWhereNotIn(this.c(field), vals), 'orWhereNotIn');
      }
    }
  }

  /**
   * scope a whereNull condition
   * @param  {string} field field name
   * @return {this} current instance
   */
  whereNull(field) {
    return this.scope((q) => q.whereNull(this.c(field)), 'whereNull');
  }

  /**
   * scope an orWhereNull condition
   * @param  {string} field field name
   * @return {this} current instance
   */
  orWhereNull(field) {
    return this.scope((q) => q.orWhereNull(this.c(field)), 'orWhereNull');
  }

  /**
   * scope a whereNotNull condition
   * @param  {string} field field name
   * @return {this} current instance
   */
  whereNotNull(field) {
    return this.scope((q) => q.whereNotNull(this.c(field)), 'whereNotNull');
  }

  /**
   * scope an orWhereNotNull condition
   * @param  {string} field field name
   * @return {this} current instance
   */
  orWhereNotNull(field) {
    return this.scope((q) => q.whereNotNull(this.c(field)), 'orWhereNotNull');
  }

  /**
   * scope a whereBetween condition
   * @param  {string} field field name
   * @param  {[mixed]} range range of vals
   * @return {this} current instance
   */
  whereBetween(field, [min, max]) {
    return this.scope((q) => q.whereBetween(this.c(field), [min, max]), 'whereBetween');
  }

  /**
   * scope a orWhereBetween condition
   * @param  {string} field field name
   * @param  {[mixed]} range range of vals
   * @return {this} current instance
   */
  orWhereBetween(field, [min, max]) {
    return this.scope((q) => q.orWhereBetween(this.c(field), [min, max]), 'orWhereBetween');
  }

  /**
   * scope a whereNotBetween condition
   * @param  {string} field field name
   * @param  {[mixed]} range range of vals
   * @return {this} current instance
   */
  whereNotBetween(field, [min, max]) {
    return this.scope((q) => q.whereNotBetween(this.c(field), [min, max]), 'whereNotBetween');
  }

  /**
   * scope a orWhereNotBetween condition
   * @param  {string} field field name
   * @param  {[mixed]} range range of vals
   * @return {this} current instance
   */
  orWhereNotBetween(field, [min, max]) {
    return this.scope((q) => q.orWhereNotBetween(this.c(field), [min, max]), 'orWhereNotBetween');
  }

  /**
   * scope a whereRaw condition
   * @param  {string} condition raw where condition
   * @param  {[mixed]} bindings condition bindings
   * @return {this} current instance
   */
  whereRaw(condition, bindings) {
    return this.scope((q) => q.whereRaw(condition, bindings), 'whereRaw');
  }

  /**
   * scope a orWhereRaw condition
   * @param  {string} condition raw where condition
   * @param  {[mixed]} bindings condition bindings
   * @return {this} current instance
   */
  orWhereRaw(condition, bindings) {
    return this.scope((q) => q.orWhereRaw(condition, bindings), 'orWhereRaw');
  }

  /**
   * scope a transaction
   * @param  {knex.transaction} trx the ongoing transaction
   * @return {this} current instance
   */
  transacting(trx) {
    return this.scope((q) => { q._orm.trx = trx; q.transacting(trx); }, 'transacting');
  }

  /**
   * scope for a page number
   * @param  {int} page page number
   * @param  {int} perPage records per page
   * @return {this} current instance
   */
  forPage(page, perPage) {
    page = parseInt(page, 10);
    page = page < 1 ? 1 : page;
    perPage = (isNumber(perPage) && perPage > 0) ? perPage : this.props.perPage;

    const [limit, offset] = [perPage, ((page - 1) * perPage)];

    return this.limit(limit).offset(offset);
  }

  /**
   * apply a scope which sets an offset
   * @param  {int} offset offset to be set on the query
   * @return {this} current instance
   */
  offset(offset) {
    return this.scope((q) => q.offset(offset), 'offset');
  }

  /**
   * apply a scope which sets a limit on the query
   * @param  {int} limit limit to be set on the query
   * @return {this} current instance
   */
  limit(limit) {
    return this.scope((q) => q.limit(limit), 'limit');
  }

  /**
   * apply a scope which sets an order on the query
   * @param  {string} field column by which to order
   * @param  {string} direction should be 'asc', 'desc'
   * @return {this} current instance
   */
  orderBy(field, direction) {
    return this.scope((q) => q.orderBy(this.c(field), direction), 'orderBy');
  }

  /**
   * apply a scope which sets an orderByRaw on the query
   * @param  {string} sql sql for the order by
   * @param {array} bindings bindings for orderByRaw
   * @return {this} current instance
   */
  orderByRaw(sql, bindings) {
    return this.scope((q) => q.orderByRaw(sql, bindings), 'orderByRaw');
  }

  /**
   * apply a scope which sets a groupBy on the query
   * @param  {...string} args columns to group by
   * @return {this} current instance
   */
  groupBy(...args) {
    return this.scope((q) => q.groupBy(...this.c(args)), 'groupBy');
  }

  /**
   * apply a scope which sets a groupByRaw on the query
   * @param  {string} sql sql for the group by
   * @param {array} bindings bindings for groupBy
   * @return {this} current instance
   */
  groupByRaw(sql, bindings) {
    return this.scope((q) => q.groupByRaw(sql, bindings), 'groupByRaw');
  }

  /**
   * apply a scope which sets a having clause on the query
   * @param  {string} col column
   * @param  {op} op  operator
   * @param  {val} val value
   * @return {this} current instance
   */
  having(col, op, val) {
    return this.scope((q) => q.having(col, op, val), 'having');
  }

  /**
   * apply a scope which sets a having clause on the query
   * @param  {string} sql sql string for the having clause
   * @param  {array} bindings bindings for the sql
   * @return {this} current instance
   */
  havingRaw(sql, bindings) {
    return this.scope((q) => q.havingRaw(sql, bindings), 'havingRaw');
  }

  /**
   * apply a scope to select some columns
   * @param  {mixed} cols the columns to select
   * @return {this} current instance
   */
  select(cols) {
    return this.scope((q) => { q._orm.columns = this.c(cols); }, 'select');
  }

  /**
   * apply a scope which enables a cache on the current query
   * @param  {int} lifetime lifetime in milliseconds
   * @return {this} current instance
   */
  cache(lifetime) {
    return this.scope((q) => { q._orm.cacheEnabled = true; q._orm.cacheLifetime = lifetime; }, 'cache');
  }

  /**
   * apply a scope which sets the flag for destruction of cache
   * @return {this} current instance
   */
  uncache() {
    return this.scope((q) => { q._orm.destroyCache = false; }, 'uncache');
  }

  /**
   * add a scope to eager-load various relations
   * @param  {mixed} eagerLoads relations to eager-load with constraints, {} or []
   * @return {this} current instance
   */
  eagerLoad(eagerLoads) {
    eagerLoads = this.parseEagerLoads(eagerLoads);
    return this.scope((q) => { assign(q._orm.eagerLoads, eagerLoads); }, 'eagerLoad');
  }

  /**
   * parse and eagerLoads argument
   * @param  {mixed} eagerLoads eagerLoads to be parsed, {} or []
   * @return {this} current instance
   */
  parseEagerLoads(eagerLoads) {
    // will be used when no existing constraint is found
    // will be replaced per relation if a proper constraint is provided for it
    const placeHolderConstraint = () => {};

    // if eagerLoads is of the form ['foo', 'foo.bar', {'foo.baz': (t) => { t.where('active', true); }}]
    // then use placeHolderConstraint for 'foo' & 'foo.bar'
    // and reduce to form {'rel1': constraint1, 'rel2': constraint2}
    if (isArray(eagerLoads)) {
      return this.parseEagerLoads(
        eagerLoads.map((eagerLoad) => {
          if (isUsableObject(eagerLoad)) {
            return toPlainObject(eagerLoad);
          } else {
            return {[eagerLoad]: placeHolderConstraint};
          }
        }).reduce((eagerLoadsObject, eagerLoad) => {
          return assign(eagerLoadsObject, eagerLoad);
        }, {})
      );
    }

    // processing the object form of eagerLoads
    return Object.keys(eagerLoads)
      .reduce((allRelations, relation) => {
        if (relation.indexOf('.') === -1) {
          return allRelations.concat([relation]);
        } else {
          // foo.bar.baz
          // ->
          // foo
          // foo.bar
          // foo.bar.baz
          return allRelations.concat(
            relation.split('.').reduce((relationParts, part) => {
              return relationParts.concat([relationParts.slice(-1).concat([part]).join('.')]);
            }, [])
          );
        }
      }, [])
      .reduce((parsedEagerLoads, relation) => {
        if (relation in eagerLoads) {
          return assign(parsedEagerLoads, {[relation]: eagerLoads[relation]});
        } else {
          return assign(parsedEagerLoads, {[relation]: placeHolderConstraint});
        }
      }, {})
    ;
  }

  /**
   * clear table's cache
   * @return {Promise} promise for clearing table's cache
   */
  clearCache() {
    return this.cache.clear().then(() => this);
  }

  /**
   * returns key which will be used to cache a query's result
   * @param  {knex.query} q the query which is being used to fetch result
   * @return {string} md5 hash of the query
   */
  queryCacheKey(q) {
    return md5(q.toString());
  }

  /**
   * uncaches results of a query if needed
   * @param  {knex.query} q query being used to fetch result
   * @return {Promise} a promise of the query destroyCache disabled
   */
  uncacheQueryIfNeeded(q) {
    if (q._orm.destroyCache) {
      return this.cache.del(this.queryCacheKey(q)).then(() => {
        q._orm.destroyCache = false;
        return q;
      });
    } else {
      return Promise.resolve(q);
    }
  }

  /**
   * fetches results for the query from cache or database
   * @param  {knex.query} q query being used to fetch the result
   * @return {Promise} promise of object {q, result}
   */
  fetchResultsFromCacheOrDatabase(q) {
    if (q._orm.cacheEnabled) {
      const key = this.queryCacheKey(q);

      return this.cache.get(key).then((result) => {
        if (result !== null) {
          return result;
        } else {
          return q.then((result) => {
            return this.cache(key, result, q._orm.cacheLifetime).then(() => result);
          });
        }
      });
    } else {
      return q.then((result) => result);
    }
  }

  /**
   * process the result of a query, strip table's name,
   * replace '.' with '__' in columns with different table-prefix,
   * parse count if the query is a count query
   * @param  {mixed} result result fetched for the query
   * @param  {options} options whether we are fetching count results
   * @return {mixed} the processed result
   */
  processResult(result, options) {
    const {count} = isUsableObject(options) ? toPlainObject(options) : {count: false};

    if (count === true) {
      // result[0].count is how knex gives count query results
      return parseInt(result[0].count, 10);
    } else if (isArray(result)) {
      // processing an array of response
      return this.processors.collection(result.map((row) => this.processResult(row, {count})));
    } else if (isUsableObject(result)) {
      // processing individual model results
      result = toPlainObject(result);
      return this.processors.model(Object.keys(result).reduce((processed, key) => {
        if (key.indexOf('.') > -1) {
          if (key.indexOf(this.tableName()) === 0) {
            return assign(processed, {[key.split('.')[1]]: result[key]});
          } else {
            return assign(processed, {[key.split('.').join('__')]: result[key]});
          }
        } else {
          return assign(processed, {[key]: result[key]});
        }
      }, {__table: this.tableName()}));
    } else {
      // processing other random values
      return result;
    }
  }

  /**
   * eager load relations for an array of models
   * @param  {array} models of models
   * @param  {object} eagerLoads a processed eagerLoads with constraints
   * @return {Promise} promise which resilves when all relations have loaded
   */
  loadRelations(models, eagerLoads) {
    if ((isArray(models) && models.length === 0)) {
      // don't do anything for empty values
      return Promise.resolve(models);
    }

    return Promise.all(Object.keys(eagerLoads)
      // filter all top level relations
      .filter((relation) => relation.indexOf('.') === -1)
      .map((relation) => {
        // check for the relation actually being there
        if (! this.definedRelations.has(relation)) {
          throw new Error(`invalid relation ${relation}`);
        }

        return this[relation]()
          .eagerLoad(this.subEagerLoads(relation, eagerLoads))
          .constrain(eagerLoads[relation])
          .load(models)
        ;
      })
    ).then((results) => {
      return results.reduce((mergedResult, result) => {
        return merge(mergedResult, result);
      }, models);
    });
  }

  /**
   * get the subEagerLoads for a relation, given a set of eagerLoads
   * @param  {string} relation name of the relation
   * @param  {object} eagerLoads {relationName: cosntraint} form eagerLoads
   * @return {object} subEagerLoads of relation with constraints
   */
  subEagerLoads(relation, eagerLoads) {
    return Object.keys(eagerLoads)
      .filter((relationName) => {
        return relationName.indexOf(relation) === 0 && relationName !== relation;
      })
      .map((relationName) => {
        return relationName.split('.').slice(1).join('.');
      })
      .reduce((subEagerLoads, subRelationName) => {
        return assign(subEagerLoads, {
          [subRelationName]: eagerLoads[`${relation}.${subRelationName}`]
        });
      }, {})
    ;
  }

  /**
   * get the first row for the scoped query
   * @return {Promise} promise which resolves the result
   */
  first() {
    return this.limit(1).all().then((result) => (
      result.length > 0 ? result[0] : null
    ));
  }

  /**
   * get all distinct rows from the scoped query
   * @param  {options} options whether allow dups in all
   * @return {Promise} promise which resolves the result
   */
  all(options) {
    const {withDuplicates} = isUsableObject(options) ? toPlainObject(options) : {withDuplicates: false};

    const q = this.query();

    if (withDuplicates !== true) {
      q.distinct();
    }

    return this.uncacheQueryIfNeeded(q).then(() => {
      return this.fetchResultsFromCacheOrDatabase(q);
    }).then((models) => {
      return this.processResult(models);
    }).then((models) => {
      return this.loadRelations(models, q._orm.eagerLoads);
    });
  }

  /**
   * get count of the scoped result set. works well
   * even when you have groupBy etc in your queries
   * @param {object} options count options
   * @return {int} count of the result set
   */
  count(options) {
    const {countDuplicates} = isUsableObject(options) ? toPlainObject(options) : {countDuplicates: false};

    const q = this.attachOrmNSToQuery(
      this.orm.knex.count('*').from((q) => {
        q.from(this.tableName());
        this.scopeTrack.apply(q);
        if (countDuplicates !== true) {
          q.distinct();
        }
        q.as('t1');
      })
    );

    return this.uncacheQueryIfNeeded(q).then(() => {
      return this.fetchResultsFromCacheOrDatabase(q);
    }).then((result) => {
      return this.processResult(result, {count: true});
    });
  }

  /**
   * find a single model for supplied conditions
   * @param  {...mixed} args conditions for finding the model
   * @return {Promise} promise for found model
   */
  find(...args) {
    switch (args.length) {
      case 0: return this.first();
      case 1: return ((val) => {
        if (isUsableObject(val)) {
          return this.where(val).first();
        } else {
          return this.whereKey(val).first();
        }
      })(...args);
      default: return this.where(...args).first();
    }
  }

  /**
   * delete the scoped data set
   * @param  {...mixed} args further conditions for deletion
   * @return {Promise} promise for when deletion has completed
   */
  del(...args) {
    switch (args.length) {
      case 0: return this.query().del();
      case 1: return ((condition) => {
        if (isUsableObject(condition)) {
          return this.where(condition).del();
        } else {
          // else we are deleting based on a key
          return this.whereKey(condition).del();
        }
      })(...args);
      default: this.where(...args).del();
    }
  }

  /**
   * truncate the table
   * @return {Promise} promise for when truncate has completed
   */
  truncate() {
    return this.newQuery().truncate();
  }

  /**
   * get timestamp cols being used by the table
   * @return {array} [createdAtCol, updatedAtCol]
   */
  timestampsCols() {
    const timestamps = isArray(this.props.timestamps) ? this.props.timestamps : ['created_at', 'updated_at'];
    if (timestamps.length === 1) {
      return [timestamps[0], timestamps[0]];
    } else {
      return timestamps;
    }
  }

  /**
   * attach timestamp to values
   * @param  {mixed} values values to be timestamped
   * @param  {options} options.op operation being performed (insert/update)
   * @return {mixed} timestamped
   */
  attachTimestampToValues(values, {op}) {
    if (isArray(values)) {
      return values.map((val) => this.attachTimestampToValues(val));
    }

    if (this.props.timestamps !== false) {
      const timestamp = new Date();
      const [createdAtCol, updatedAtCol] = this.timestampsCols();

      if (! isDate(values[createdAtCol]) && op === 'insert') {
        assign(values, {[createdAtCol]: timestamp});
      }

      if (! isDate(values[updatedAtCol]) && ['insert', 'update'].indexOf(op) > -1) {
        assign(values, {[updatedAtCol]: timestamp});
      }
    }

    return values;
  }

  /**
   * check if db is postgres
   * @return {Boolean} true/false
   */
  isPostgresql() {
    return ['postgresql', 'pg', 'postgres'].indexOf(
      this.orm.knex.client.config.client
    ) > -1;
  }

  /**
   * generate a new key-val if autoId true
   * @return {Promise} uuid
   */
  genKeyVal() {
    if (! this.props.autoId) {
      return Promise.resolve({});
    }

    const key = isArray(this.key()) ? this.key() : [this.key()];

    const newKey = key.reduce((condition, part) => {
      return assign(condition, {[part]: uuid.v4()});
    }, {});

    return this.newQuery().where(newKey).first().then((model) => {
      if (isUsableObject(model)) {
        return this.genKeyVal();
      } else {
        return newKey;
      }
    });
  }

  /**
   * pick only those {key: val} where key is a table
   * column. useful for table insertion and updation
   * @param  {array} columns an array of column-names
   * @param  {mixed} values array or object of values
   * @return {mixed} array or object of values
   */
  pickColumnValues(columns, values, {op}) {
    if (isArray(values)) {
      return values.map((v) => this.pickColumnValues(columns, v));
    }

    const keys = isArray(this.key()) ? this.key() : [this.key];

    return columns
      .filter((col) => {
        if (op === 'update' && keys.indexOf(col) > -1) {
          return false;
        } else {
          return true;
        }
      })
      .reduce((parsed, col) => {
        if (col in values) {
          return assign(parsed, {[col]: values[col]});
        } else {
          return parsed;
        }
      }, {})
    ;
  }

  /**
   * insert values in the table
   * @param  {object} model model or array of models to be inserted
   * @return {Promise} promise for when insert has completed
   */
  insertModel(model) {
    const opFlags = {op: 'insert'};

    return Promise.all([this.columns(), this.genKeyVal()])
      .then(([columns, keyVal]) => {
        model = assign({}, keyVal, this.attachTimestampToValues(
          this.pickColumnValues(columns, model, opFlags),
          opFlags
        ));

        return this.newQuery().returning('*')
          .insert(model).then(([model]) => model);
      })
    ;
  }

  insertAll(models=[]) {
    return Promise.all(models.map((m) => this.insertModel(m)));
  }

  insert(values) {
    if (isArray(values)) {
      return this.insertAll(values);
    } else {
      return this.insertModel(values);
    }
  }

  /**
   * update the scoped data set
   * @param  {...mixed} args data for updation, or key and data for updation
   * @return {Promise} promise for when updation has completed
   */
  update(...args) {
    if (args.length === 0) {
      throw new Error('Invalid update');
    } else if (args.length >= 2) {
      // that means we have been provided a key, and values to update
      // against it
      const [keyCondition, values] = args;
      return this.whereKey(keyCondition).update(values);
    } else if (args.length === 1) {
      // if we reach here then we can safely say that an object has
      // been provided to the update call
      return this.rawUpdate(args[0], {returning: true});
    }
  }

  /**
   * Perform an update operation, can be used for batch updates.
   * @param  {object}  values values to be used to perform an update
   * @param  {Boolean} options.returning whether the results should be returned
   * @return {Promise} promise for when update has finished
   */
  rawUpdate(values, {returning=false}) {
    const opFlags = {op: 'update'};

    return this.columns().then((columns) => {
      values = this.attachTimestampToValues(
        this.pickColumnValues(columns, values, opFlags),
        opFlags
      );

      if (returning === true) {
        // we return the first object when returning is true
        // use update method uses this, useful for handpicked updates
        // which is mostly the case with business logic
        return this.query().returning('*').update(values)
          .then(([model]) => model);
      } else {
        // use this for batch updates. we don't return anything
        // in batch updates. if you want returning batch updates,
        // just use knex!
        return this.query().update(values);
      }
    });
  }

  /**
   * get a new hasOne relation
   * @param  {string}  related related table name
   * @param  {string}  foreignKey foreign-key on related table
   * @param  {string}  key key to match with on this table
   * @return {HasOne}  HasOne relation instance
   */
  hasOne(related, foreignKey, key) {
    key = key || this.key();

    return new HasOne(this, this.table(related), foreignKey, key);
  }

  /**
   * get a new hasMany relation
   * @param  {string}  related related table name
   * @param  {string}  foreignKey foreign-key on related table
   * @param  {string}  key key to match with on this table
   * @return {HasMany} HasMany relation instance
   */
  hasMany(related, foreignKey, key) {
    key = key || this.key();

    return new HasMany(this, this.table(related), foreignKey, key);
  }

  /**
   * get a new hasManyThrough relation
   * @param  {string}  related related table name
   * @param  {string}  through through table name
   * @param  {string}  firstKey foreign-key on through table
   * @param  {string}  secondKey foreign-key on related table
   * @return {HasManyThrough} HasManyThrough relation instance
   */
  hasManyThrough(related, through, firstKey, secondKey) {
    return new HasManyThrough(
      this, this.table(related), this.table(through), firstKey, secondKey
    );
  }

  /**
   * get a new BelongsTo relation
   * @param  {string} related related table name
   * @param  {string} foreignKey foreign-key on this table
   * @param  {string} otherKey key to match on other table
   * @return {BelongsTo} BelongsTo relation instance
   */
  belongsTo(related, foreignKey, otherKey) {
    related = this.table(related);
    otherKey = otherKey || related.key();

    return new BelongsTo(this, related, foreignKey, otherKey);
  }

  /**
   * get a new BelongsToMany relation
   * @param  {string} related related table name
   * @param  {string} pivot pivot table name
   * @param  {string} foreignKey foreign-key on this table
   * @param  {string} otherKey other-key on this table
   * @param  {function} joiner extra join conditions
   * @return {BelongsToMany} BelongsToMany relation instance
   */
  belongsToMany(related, pivot, foreignKey, otherKey, joiner=(() => {})) {
    return new BelongsToMany(
      this, this.table(related), this.table(pivot), foreignKey, otherKey,
      joiner
    );
  }

  /**
   * get a new MorphOne relation
   * @param  {string} related related table name
   * @param  {string} inverse inverse relation ship name
   * @return {MorphOne} MorphOne relation instance
   */
  morphOne(related, inverse) {
    related = this.table(related);

    return new MorphOne(this, related, related[inverse]());
  }

  /**
   * get a new MorphMany relation
   * @param  {string} related related table name
   * @param  {string} inverse inverse relation ship name
   * @return {MorphMany} MorphMany relation instance
   */
  morphMany(related, inverse) {
    related = this.table(related);

    return new MorphMany(this, related, related[inverse]());
  }

  /**
   * get a new MorphTo relation
   * @param  {array} tables array of table names this relation morph's to
   * @param  {string} typeField  type-field name
   * @param  {string} foreignKey foreign-key name
   * @return {MorphTo} MorphTo relation instance
   */
  morphTo(tables, typeField, foreignKey) {
    tables = tables.map((t) => this.table(t));

    return new MorphTo(this, tables, typeField, foreignKey);
  }
}

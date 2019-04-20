const redisdsl = require('redisdsl');
const {isString, isNumber, isArray} = require('lodash');
const Queue = require('./Queue');
const Hash = require('./Hash');

class Connection {
  constructor(config) {
    this.config = {
      ...config,
      prefix: config.keyPrefix
    };

    const {
      quit,
      psetex,
      set,
      get,
      exists,
      del,
      lrange,
      rpush,
      lpop,
      eval: rEval
    } = redisdsl(this.config);

    Object.assign(this, {
      cmd: {
        quit,
        psetex,
        set,
        get,
        exists,
        del,
        lrange,
        rpush,
        lpop,
        rEval,
        clear: (prefix) => {
          const pattern = isString(prefix) ? `${prefix}*` : `*`;

          const luaScript = [
            `local keys = redis.call("keys", ARGV[1])`,
            `for i=1,#keys,5000 do`,
            `    redis.call("del", unpack(keys, i, math.min(i+4999, #keys)))`,
            `end`,
            `return keys`
          ].join('\r\n');

          return this.cmd.rEval(luaScript, `${this.config.prefix}${pattern}`);
        }
      }
    });

    // console.log(this.cmd.clear);
  }
}

class Client {
  constructor(config) {
    this.connection = new Connection(config);
  }

  disconnect() {
    return this.connection.cmd.quit();
  }

  set(key, val, lifetime) {
    if (isNumber(lifetime)) {
      return this.connection.cmd.psetex(key, lifetime, JSON.stringify(val));
    } else {
      return this.connection.cmd.set(key, JSON.stringify(val));
    }
  }

  put(values, lifetime) {
    return Promise.all(
      Object.keys(values).map((key) => this.connection.cmd.set(key, values[key], lifetime))
    );
  }

  get(key, defaultVal=null) {
    if (isArray(key)) {
      return Promise.all(key.map((k) => this.connection.cmd.get(k, defaultVal)));
    }

    return this.connection.cmd.get(key).then((val) => {
      if (val === null) {
        return defaultVal;
      } else {
        return JSON.parse(val);
      }
    });
  }

  exists(key) {
    if (isArray(key)) {
      return Promise.all(key.map((k) => this.exists(k)));
    }

    return this.connection.cmd.exists(key).then((result) => {
      return result !== 0;
    });
  }

  del(key) {
    if (isArray(key)) {
      return Promise.all(key.map((k) => this.del(k)));
    }

    return this.connection.cmd.del(key);
  }

  delete(key) {
    return this.del(key);
  }

  clear(prefix) {
    return this.connection.cmd.clear(prefix);
  }

  range(queue, startI=0, endI=-1) {
    return this.connection.cmd.lrange(queue, startI, endI)
      .then((items) => items.map((item) => JSON.parse(item)))
    ;
  }

  nq(queue, vals) {
    if (isArray(vals)) {
      vals = vals.map((v) => JSON.stringify(v));
    } else {
      vals = JSON.stringify(vals);
    }

    return this.connection.cmd.rpush(queue, vals);
  }

  dq(queue) {
    return this.connection.cmd.lpop(queue).then((val) => {
      return JSON.parse(val);
    });
  }

  queue(name) {
    return new Queue(this, name);
  }

  hash(name) {
    return new Hash(this, name);
  }
}

module.exports = Client;

const {isArray} = require('lodash');

class Hash {
  constructor(client, name) {
    this.client = client;
    this.name = name;
  }

  fullKey(key) {
    if (isArray(key)) {
      return key.map((k) => this.fullKey(k));
    }

    return `${this.name}.${key}`;
  }

  assign(values, lifetime) {
    return Promise.all(
      Object.keys(values).map((key) => this.set(key, values[key], lifetime))
    );
  }

  has(key) {
    return this.client.exists(this.fullKey(key));
  }

  get(key, defaultVal=null) {
    return this.client.get(this.fullKey(key), defaultVal);
  }

  set(key, val, lifetime) {
    return this.client.set(this.fullKey(key), val, lifetime);
  }

  del(key) {
    return this.client.del(this.fullKey(key));
  }

  delete(key) {
    return this.delete(key);
  }

  clear() {
    return this.client.clear(`${this.name}.`);
  }
}

module.exports = Hash;

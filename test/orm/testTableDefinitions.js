const Table = require('../../src/Table');

function testTableDefinitions(assert, orm) {
  orm.defineTable({
    name: 'users',

    props: {
      uuid: true,
      timestamps: true
    },

    relations: {
      roles() {
        return this.manyToMany('roles', 'user_role', 'user_id', 'role_id');
      },

      posts() {
        return this.hasMany('posts', 'user_id');
      },

      comments() {
        return this.hasMany('comments', 'user_id');
      },

      profilePhoto() {
        return this.morphOne('photos', 'doc');
      },

      receivedComments() {
        return this.hasManyThrough('comments', 'posts', 'user_id', 'post_id');
      }
    },

    methods: {
      hashPassword(password) {
        // this is just dummy stuff, do not use a base64 to
        // hash passwords in real life
        return new Buffer(password).toString('base64');
      },

      uuidFlag() {
        return this.props.uuid;
      }
    }
  });

  orm.defineTable({
    name: 'roles',

    props: {
      uuid: true,
      timestamps: true
    },

    relations: {
      users() {
        return this.manyToMany('users', 'user_role', 'role_id', 'user_id');
      }
    }
  });

  orm.defineTable({
    name: 'user_role',

    props: {
      key: ['user_id', 'role_id'],
      uuid: false,
      timestamps: true
    }
  });

  orm.defineTable({
    name: 'posts',

    props: {
      uuid: true,
      timestamps: true
    },

    relations: {
      author() {
        return this.belongsTo('users', 'user_id');
      },

      comments() {
        return this.hasMany('comments', 'post_id');
      },

      photos() {
        return this.morphMany('photos', 'doc');
      }
    }
  });

  orm.defineTable({
    name: 'comments',

    props: {
      uuid: true,
      timestamps: true
    },

    relations: {
      user() {
        return this.belongsTo('users', 'user_id');
      },

      post() {
        return this.belongsTo('posts', 'post_id');
      },

      photos() {
        return this.morphMany('photos', 'doc');
      }
    },

    scopes: {
      whereNotFlagged() {
        return this.whereNot('is_flagged', true);
      },

      whereFlagged() {
        return this.where('is_flagged', true);
      }
    }
  });

  orm.defineTable({
    name: 'photos',

    props: {
      uuid: true,
      timestamps: true
    },

    relations: {
      doc() {
        return this.morphTo(['users', 'posts', 'comments'], 'doc_type', 'doc_id');
      },

      detail() {
        return this.hasOne('photo_details', 'photo_id');
      }
    }
  });

  orm.defineTable({
    name: 'photo_details',

    props: {
      timestamps: true
    },

    relations: {
      photo() {
        return this.belongsTo('photos', 'photo_id');
      }
    }
  });

  orm.defineTable({
    name: 'tags',

    props: {
      uuid: true,
      timestamps: true
    },

    relations: {
      posts() {
        return this.tagables('posts');
      },

      photos() {
        return this.tagables('photos');
      }
    },

    methods: {
      tagables(table) {
        return this.manyToMany(table, 'tagable_tag', 'tag_id', 'tagable_id', (j) => {
          j.on('tagable_tag.tagable_type', '=', this.raw('?', [table]));
        }).withPivot('tagable_type');
      },

      joinTagables(table) {
        return this.tagables(table).join((j) => {
          j.on('tagable_tag.tagable_type', '=', this.raw('?', ['posts']));
        }, table);
      }
    },

    joints: {
      joinPosts() {
        return this.joinTagables('posts');
      },

      joinPhotos() {
        return this.joinTagables('photos');
      }
    }
  });

  orm.defineTable({
    name: 'tagable_tag',

    props: {
      key: ['tagable_type', 'tagable_id', 'tag_id'],
      timestamps: true
    }
  });

  console.log('testing defined tables');

  // we reached here means tables have been defined as expected
  Array.from(orm.tables.keys()).forEach((tableName) => {
    assert.ok(orm.tbl(tableName) instanceof Table, `orm.tbl(${tableName}) instance of Table`);
  });

  // check to see if methods work as expected
  assert.deepEqual(orm.tbl('users').uuidFlag(), true, 'method test#1 pass');
  assert.deepEqual(
    orm.tbl('users').hashPassword('foo'),
    new Buffer('foo').toString('base64'),
    'method test #2 pass'
  );

  // checking relation definitions
  Array.from(orm.tbl('tags').definedRelations).forEach((rel) => {
    assert.notEqual(['posts', 'users', 'photos'].indexOf(rel), -1, `${rel} is valid relation`);
  });

  // checking method definitions
  Array.from(orm.tbl('tags').definedMethods).forEach((method) => {
    assert.notEqual(['tagables', 'joinTagables'].indexOf(method), -1, `${method} is valid method`);
  });

  // checking joints defintions
  Array.from(orm.tbl('tags').definedJoints).forEach((joint) => {
    assert.notEqual(['joinPosts', 'joinUsers', 'joinPhotos'].indexOf(joint), -1, `${joint} is valid joint`);
  });

  // checking scope definitions
  Array.from(orm.tbl('comments').definedScopes).forEach((scope) => {
    assert.notEqual(['whereFlagged', 'whereNotFlagged'].indexOf(scope), -1, `${scope} is valid scope`);
  });
}

module.exports = testTableDefinitions;

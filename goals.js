// table definitions should be loaded up at app startup time
// table definitions should create classes for tables to work
// new, fully functional tables should be instantiable at runtime from raw table class
// table definitions should be extendable to an extent
// the extensions should preferably be done at app startup only
// table instance should be light weight, with most of the stuff in prototypes
import orm from 'orm';

orm.defineTable('users', {
  // standard table definition objects
  props: {
    key: 'id',
    // or
    // key: ['user_id', 'post_id'],

    autoId: true,
    // ignored when `key` is an array
    // set this true if the db auto assigns the key column value

    perPage: 25,
    // standard batch size per page used by `forPage` method
    // forPage method uses offset
    // avoid that and use a keyset in prod (http://use-the-index-luke.com/no-offset)

    timestamps: true
    // or
    // timestamps: ['created_at', 'updated_at'] (these are defaults when `true`)
    // will be assigned in this order only
  },

  // processors for processing single row or collection of rows data received
  // from the database
  processors: {
    model(row) {
      return row;
    },

    collection(rows) {
      return rows;
    }
  },

  scopes: {
    filterAdmins() {
      return this.joinRoles().where('roles.name', 'admin');
    },

    activeSince(date) {
      return this.where('users.updated_at', '>', date);
    },

    hasMinimumPosts(num) {
      return this.joinPosts().groupBy('users.id').having(this.raw('count(posts.id)'), '>', num);
    }
  },

  joints: {
    joinRolesPivot() {
      return this.scope((q) => {
        q.join('user_role', 'users.id', '=', 'user_role.user_id');
      });
    },

    joinRoles() {
      return this.joinRolesPivot().scope((q) => {
        q.join('roles', 'user_role.role_id', 'role_id');
      });
    }
  },

  relations: {
    roles() {
      return this.belongsToMany('roles', 'user_role', 'user_id', 'role_id');
    },

    posts() {
      return this.hasMany('posts', 'user_id');
    }
  }
});

orm.defineTable('roles', {
  props: {
    key: 'id',
    autoId: true,
    perPage: 25,
    timestamps: true
  },

  joints: {
    joinUsersPivot() {
      return this.scope((q) => {
        q.join('user_role', 'user_role.role_id', '=', 'roles.id');
      });
    }
  },

  scopes: {
    forUser(user) {
      return this.joinUsersPivot().where('user_role.user_id', '=', user.id);
      // or
      // return this.joinPivot('users').where('user_role.user_id', '=', user.id);
    }
  },

  relations: {
    users() {
      return this.belongsToMany('users', 'user_role', 'user_id', 'role_id');
    }
  }
});

orm.defineTable('posts', {
  props: {
    key: 'id',
    autoId: true,
    perPage: 25,
    timestamps: true
  },

  processors: {
    model(row) {
      return row;
    },

    collection(rows) {
      return rows;
    }
  },

  scopes: {
    publishedAfter(date) {
      return this.where('pulished_at', '>=', date);
    },

    forUser(user) {
      return this.where('user_id', user.id);
    },

    forTagNames(tagNames) {
      return this.joinTags().whereIn('tags.name', tagNames);
      // or
      // return this.joinRel('tags').whereIn('tags.name', tagNames);
      // return this.joinRelation('tags').whereIn('tags.name', tagNames);
      // return this.joinRel('tags', (j) => {
      //   j.on('tags.active', this.raw(true));
      // }).whereIn('tags.name', tagNames);
    }
  },

  joints: {
    joinTagsPivot() {
      return this.scope((q) => {
        q.join('tagable_tag', (j) => {
          j.on('posts.id', '=', 'tagable_tag.tagable_id')
           .on('tagable_tag.type', this.raw('?', ['posts']));
        });
      });
    },

    joinTags() {
      return this.joinTagsPivot().scope((q) => {
        q.join('tags', 'tagable_tag.tag_id', '=', 'tags.id');
      });
    }
  },

  relations: {
    tags() {
      return this.morphToMany('tags', 'tagable_tag', 'tagable_id', 'tag_id');
    },

    author() {
      return this.belongsTo('users', 'user_id');
    },

    comments() {
      return this.hasMany('comments', 'post_id');
    }
  }
});

orm.defineTable('tags', {
  props: {
    key: 'id',
    autoId: true,
    perPage: 25,
    timestamps: true
  },

  processors: {
    model(row) {
      return row;
    },

    collection(rows) {
      return rows;
    }
  },

  scopes: {
    forTagables(type, tagables) {
      const ids = tagables.map(({id}) => id);
      return this.joinTagablesPivot().where({type}).where('id', 'in', ids);
    }
  },

  relations: {
    posts() {
      return this.morphToMany('posts', 'tagable_tag', 'tag_id', 'tagable_id');
    },

    comments() {
      return this.morphToMany('comments', 'tagable_tag', 'tag_id', 'tagable_id');
    }
  }
});

orm.defineTable('comments', {
  props: {
    key: 'id',
    autoId: true,
    perPage: 25,
    timestamps: true
  },

  processors: {
    model(row) {
      return row;
    },

    collection(rows) {
      return rows;
    }
  },

  scopes: {
    forPost(post) {
      return this.where('post_id', post.id);
    },

    byUser(user) {
      return this.where('user_id', user.id);
    }
  }
});

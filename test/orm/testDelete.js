function testDelete(assert, orm) {
  const {table} = orm.exports;
  console.log('testing delete');

  return table('photos').all().then((allPhotos) => {
    return table('photos').del(allPhotos[0].id)
      .then(() => table('photos').find(allPhotos[0].id))
      .then((existing) => assert.ok(!existing, 'del(key) works'))
      .then(() => table('photos').insert(allPhotos[0]))
    ;
  }).then(() => table('photos').all()).then((allPhotos) => {
    return table('photos').whereKey(allPhotos[0].id).del()
      .then(() => table('photos').find(allPhotos[0].id))
      .then((existing) => assert.ok(!existing, '.where(...).del() works'))
      .then(() => table('photos').insert(allPhotos[0]))
    ;
  }).then(() => table('photos').all().then((allPhotos) => {
    return table('photos').del('id', allPhotos[0].id)
      .then(() => table('photos').find(allPhotos[0].id))
      .then((existing) => assert.ok(!existing, '.where(...).del() works'))
      .then(() => table('photos').insert(allPhotos[0]))
    ;
  }));
}

module.exports = testDelete;

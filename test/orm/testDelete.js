export default async function testDelete(assert, orm) {
  const {table} = orm.exports;
  console.log('testing delete');

  await (async () => {
    const allPhotos = await table('photos').all();
    await table('photos').del(allPhotos[0].id);
    const existing = await table('photos').find(allPhotos[0].id);

    assert.ok(!!existing === false, 'del(key) works');

    // re-insert the photo, so its available again
    await table('photos').insert(allPhotos[0]);
  })();

  await (async () => {
    const allPhotos = await table('photos').all();
    await table('photos').whereKey(allPhotos[0].id).del();
    const existing = await table('photos').find(allPhotos[0].id);

    assert.ok(!!existing === false, '.where(...).del() works');

    // re-insert the photo, so its available again
    await table('photos').insert(allPhotos[0]);
  })();

  await (async () => {
    const allPhotos = await table('photos').all();
    await table('photos').del({id: allPhotos[0].id}).del();
    const existing = await table('photos').find(allPhotos[0].id);

    assert.ok(!!existing === false, '.del({...}) works');

    // re-insert the photo, so its available again
    await table('photos').insert(allPhotos[0]);
  })();
}

/**
 * orm.util.defineResource(
 *   'posts',
 *   {
 *     table() { return this.orm.tbl('posts').where('active', true); },
 *     providers: {
 *       listing() { return this.table() },
 *       resource() { return this.table() }
 *     },
 *     scoper() {
 *       return this.newScoper({
 *         ['filters']: this.newScoper({
 *           'title'
 *         })
 *       })
 *     }
 *       return this.newScoper({
 *         ['filters']() {
 *           return orm.util.newScoper({
 *            'title'()
 *           }).run()
 *         }
 *       })
 *     },
 *     validator() {
 *       return orm.util.newValidator({
 *       })
 *     },
 *     
 *   }
 * )
 */

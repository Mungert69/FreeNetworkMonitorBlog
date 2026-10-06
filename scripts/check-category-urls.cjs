// Run after npm run export, against an isolated Apache serving out/ with the
// Directory rules from default-ssl.conf (also present in default-ssl-local.conf).
// node scripts/check-category-urls.cjs http://localhost:PORT
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { categoryRedirects } = require('../lib/category-catalog.cjs');

async function check() {
  const base = process.argv[2];
  assert(base, 'Supply the base URL of the isolated Apache instance.');
  const xml = fs.readFileSync('out/sitemap.xml', 'utf8');
  const categories = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => new URL(m[1])).filter(url => url.pathname.startsWith('/categories/'));
  assert(categories.length, 'Expected sitemap categories.');
  for (const url of categories) {
    const response = await fetch(new URL(url.pathname, base), {redirect: 'manual'});
    assert.equal(response.status, 200, `${url.pathname} must return directly`);
    assert((await response.text()).includes(`<link rel="canonical" href="${url.href}"`), `${url.pathname}: canonical must match sitemap`);
  }
  for (const [old, target] of categoryRedirects()) {
    for (const slash of ['', '/']) {
      const response = await fetch(`${base}/categories/${old}${slash}?source=seo-check`, {redirect: 'manual'});
      assert.equal(response.status, 301, old);
      const location = new URL(response.headers.get('location'), base);
      assert.equal(location.pathname, `/categories/${target ? `${target}/` : ''}`);
      assert.equal(location.search, '?source=seo-check');
      assert.equal((await fetch(location)).status, 200);
    }
  }
  console.log(`Checked ${categories.length} category URLs and all consolidated/legacy aliases, with query preservation.`);
}
check().catch(error => { console.error(error); process.exitCode = 1; });

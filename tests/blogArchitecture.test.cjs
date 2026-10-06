const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { labels, normalizeCategories, categoryRedirects } = require('../lib/category-catalog.cjs');
const { slugify } = require('../lib/utils/slug.cjs');
const { sortByDate } = require('../lib/utils/post-order.cjs');
const { getBlogJson } = require('../lib/jsonGenerator');

test('legacy topics consolidate without duplicate tags and redirects never chain', () => {
  assert.equal(labels.length, 20);
  assert.deepEqual(normalizeCategories(['AI','Automation','Machine Learning']), ['AI and Automation']);
  assert.deepEqual(normalizeCategories(['Quantum Security','Quantum Computing','SSL/TLS']), ['Post-Quantum Security','TLS and Encryption']);
  assert.deepEqual(normalizeCategories(['Test']), ['Network Monitoring']);
  assert.throws(() => normalizeCategories(['New unmapped topic']), /Map it to an existing topic/);
  const canonical = new Set(labels.map(slugify));
  for (const [source, target] of categoryRedirects()) {
    assert(!canonical.has(source), `Canonical category ${source} must not redirect`);
    assert(target === '' || canonical.has(target), `Unknown target ${target}`);
  }
  assert.equal(new Map(categoryRedirects()).get('ssl-tls'), 'tls-and-encryption');
});

test('archives sort by date across time zones, tie by slug, and put invalid dates last', () => {
  const posts = [
    {slug:'old',frontmatter:{date:'2024-12-18T12:00:00'}},
    {slug:'b',frontmatter:{date:'2026-01-01T09:00:00Z'}},
    {slug:'invalid',frontmatter:{date:'bad'}},
    {slug:'a',frontmatter:{date:'2026-01-01T04:00:00-05:00'}},
    {slug:'latest',frontmatter:{date:'2026-01-01T09:00:01.123456'}},
  ];
  const original = posts.map(p => p.slug);
  assert.deepEqual(sortByDate(posts).map(p => p.slug), ['latest','a','b','old','invalid']);
  assert.deepEqual(posts.map(p => p.slug), original);
});

test('authoritative import removes stale posts, preserves index, and keeps newest duplicate slug', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'blog-cleanup-'));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  const folder = path.join(root,'content','posts');
  fs.mkdirSync(folder,{recursive:true}); fs.mkdirSync(path.join(root,'public'));
  fs.writeFileSync(path.join(folder,'_index.md'),'Index');
  fs.writeFileSync(path.join(folder,'default1.md'),'Welcome placeholder');
  fs.writeFileSync(path.join(folder,'removed-post.md'),'Removed from database');
  const payload = [
    {slug:'article',frontmatter:{title:'Old version',date:'2024-01-01',categories:['AI']},content:'Old'},
    {slug:'article',frontmatter:{title:'Current version',date:'2026-01-01',categories:['AI','Automation']},content:'Current'},
  ];
  await getBlogJson({axiosInstance:async()=>({data:{data:JSON.stringify(payload)}}),
    contentRoot:path.join(root,'content'),publicDir:path.join(root,'public'),outputJsonDir:path.join(root,'.json')});
  assert.deepEqual(fs.readdirSync(folder).sort(), ['_index.md','article.md']);
  const markdown = fs.readFileSync(path.join(folder,'article.md'),'utf8');
  assert.match(markdown,/Current version/); assert.match(markdown,/AI and Automation/);
  const index = JSON.parse(fs.readFileSync(path.join(root,'public','blog-index.json'),'utf8'));
  assert.equal(index.length,1); assert.equal(index[0].title,'Current version');
});

test('malformed authoritative input cannot erase existing posts', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'blog-invalid-'));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  const folder = path.join(root,'content','posts');
  fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(path.join(root,'public'));
  const retained = path.join(folder,'retained.md');fs.writeFileSync(retained,'Keep me');
  await assert.rejects(getBlogJson({axiosInstance:async()=>({data:{data:JSON.stringify([{}])}}),
    contentRoot:path.join(root,'content'),publicDir:path.join(root,'public'),outputJsonDir:path.join(root,'.json')}), /malformed posts/);
  assert.equal(fs.readFileSync(retained,'utf8'),'Keep me');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validatePublicationArtifacts,
  resolveExpectedSlug,
  validateExportArtifacts,
} = require('../lib/validate-export');

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fnmb-export-'));

test('resolveExpectedSlug prefers explicit override', () => {
  const slug = resolveExpectedSlug({ overrideSlug: 'manual-slug' });
  assert.equal(slug, 'manual-slug');
});

test('resolveExpectedSlug reads first slug from blog-index.json', () => {
  const root = makeTempDir();
  const blogIndexPath = path.join(root, 'blog-index.json');
  fs.writeFileSync(blogIndexPath, JSON.stringify([{ slug: 'latest-post' }]));

  const slug = resolveExpectedSlug({
    blogIndexFilePath: blogIndexPath,
    overrideSlug: '',
  });

  assert.equal(slug, 'latest-post');
});

test('validateExportArtifacts passes when required files exist', () => {
  const outDir = makeTempDir();
  const slug = 'latest-post';
  const postDir = path.join(outDir, 'posts', slug);

  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, 'index.html'), '<html>post</html>');
  fs.writeFileSync(path.join(outDir, 'posts', 'index.html'), '<html>posts</html>');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), '<xml/>');

  assert.doesNotThrow(() =>
    validateExportArtifacts({ outDirectory: outDir, expectedSlug: slug })
  );
});

test('validateExportArtifacts fails when slug page is missing', () => {
  const outDir = makeTempDir();

  fs.mkdirSync(path.join(outDir, 'posts'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'posts', 'index.html'), '<html>posts</html>');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), '<xml/>');

  assert.throws(
    () => validateExportArtifacts({ outDirectory: outDir, expectedSlug: 'missing-slug' }),
    /Missing expected export artifact/
  );
});


test('validateExportArtifacts rejects category URLs without an exported route', () => {
  const outDir = makeTempDir();
  fs.mkdirSync(path.join(outDir, 'posts', 'latest-post'), {recursive: true});
  fs.writeFileSync(path.join(outDir, 'posts', 'latest-post', 'index.html'), '<html/>');
  fs.writeFileSync(path.join(outDir, 'posts', 'index.html'), '<html/>');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), '<urlset><url><loc>https://example.com/categories/ssl-tls/</loc></url></urlset>');
  assert.throws(() => validateExportArtifacts({outDirectory: outDir, expectedSlug: 'latest-post'}), /Sitemap category has no exported page/);
  fs.mkdirSync(path.join(outDir, 'categories', 'ssltls'), {recursive: true});
  fs.writeFileSync(path.join(outDir, 'categories', 'ssltls', 'index.html'), '<html/>');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), '<urlset><url><loc>https://example.com/categories/ssltls/</loc></url></urlset>');
  assert.doesNotThrow(() => validateExportArtifacts({outDirectory: outDir, expectedSlug: 'latest-post'}));
});


test('publication validation rejects template routes and public index entries', () => {
  const outDir = makeTempDir();
  fs.mkdirSync(path.join(outDir, 'posts', 'default1'), {recursive: true});
  fs.writeFileSync(path.join(outDir, 'blog-index.json'), '[]');
  assert.throws(() => validatePublicationArtifacts({outDirectory: outDir}), /Placeholder post was exported/);
  fs.rmSync(path.join(outDir, 'posts', 'default1'), {recursive: true});
  fs.writeFileSync(path.join(outDir, 'blog-index.json'), '[{"slug":"default1"}]');
  assert.throws(() => validatePublicationArtifacts({outDirectory: outDir}), /Placeholder appears in blog index/);
  fs.writeFileSync(path.join(outDir, 'blog-index.json'), '[{"slug":"legitimate-test-article"}]');
  assert.doesNotThrow(() => validatePublicationArtifacts({outDirectory: outDir}));
});

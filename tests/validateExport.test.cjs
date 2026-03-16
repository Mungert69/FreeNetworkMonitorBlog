const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
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

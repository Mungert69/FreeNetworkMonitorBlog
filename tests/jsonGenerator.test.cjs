const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getDefaultPaths,
  toPlainText,
  truncate,
  createFrontmatterBlock,
  buildPostMarkdown,
  buildBlogIndex,
  writePostsToMarkdown,
  getBlogJson,
} = require('../lib/jsonGenerator');

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fnmb-json-'));

const samplePost = {
  slug: 'sample-post',
  frontmatter: {
    title: 'Sample Post',
    categories: ['AI', 'Ops "Quoted"'],
    questions: ['What is this?'],
    answers: ['A test.'],
  },
  content: '## Heading\nText [link](https://example.com).',
};

test('toPlainText removes markdown syntax and preserves readable text', () => {
  const plain = toPlainText(samplePost.content);
  assert.equal(plain, 'Heading Text https://example.com.');
});

test('getDefaultPaths resolves repo-root absolute paths', () => {
  const root = makeTempDir();
  const defaults = getDefaultPaths(root);

  assert.equal(defaults.repoRoot, path.resolve(root));
  assert.equal(defaults.jsonDir, path.join(path.resolve(root), '.json'));
  assert.equal(defaults.contentRoot, path.join(path.resolve(root), 'content'));
  assert.equal(defaults.publicDir, path.join(path.resolve(root), 'public'));
});

test('truncate adds ellipsis only when exceeding max length', () => {
  assert.equal(truncate('short', 10), 'short');
  assert.equal(truncate('abcdefghijklmnopqrstuvwxyz', 10), 'abcdefghij…');
});

test('frontmatter and markdown generation handles arrays and escaping', () => {
  const block = createFrontmatterBlock(samplePost.frontmatter);
  assert.match(block, /categories: \["AI", "Ops \\\"Quoted\\\""\]/);
  assert.match(block, /questions:\n  - "What is this\?"/);

  const markdown = buildPostMarkdown(samplePost);
  assert.ok(markdown.startsWith('---\n'));
  assert.ok(markdown.includes('## Heading'));
});

test('writePostsToMarkdown skips malformed posts and writes valid ones', () => {
  const root = makeTempDir();
  const contentRoot = path.join(root, 'content');
  const blogFolder = 'posts';

  fs.mkdirSync(contentRoot, { recursive: true });
  fs.writeFileSync(path.join(contentRoot, '_index.md'), '---\ntitle: Index\n---\n');

  writePostsToMarkdown({
    postsArray: [samplePost, { slug: '', frontmatter: null, content: 'bad' }],
    contentRoot,
    blogFolder,
  });

  const blogPath = path.join(contentRoot, blogFolder);
  assert.ok(fs.existsSync(path.join(blogPath, '_index.md')));
  assert.ok(fs.existsSync(path.join(blogPath, 'sample-post.md')));
  assert.ok(!fs.existsSync(path.join(blogPath, '.md')));
});

test('buildBlogIndex derives summary/content/url/author as expected', () => {
  const items = buildBlogIndex([
    {
      slug: 'hello',
      frontmatter: { title: 'Hello', categories: ['A'], date: '2026-01-01' },
      content: '# Hi\nThis is a long content body with **markdown** and [a link](https://x.y).',
    },
  ], {
    siteBaseUrl: 'https://example.com',
    authorFallback: 'System',
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].url, 'https://example.com/posts/hello');
  assert.equal(items[0].author, 'System');
  assert.equal(items[0].categories[0], 'A');
  assert.match(items[0].summary, /This is a long content body/);
});

test('getBlogJson writes posts.json, markdown files, and blog-index.json', async () => {
  const root = makeTempDir();
  const contentRoot = path.join(root, 'content');
  const publicDir = path.join(root, 'public');
  const outputJsonDir = path.join(root, '.json');

  fs.mkdirSync(contentRoot, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(outputJsonDir, { recursive: true });
  fs.writeFileSync(path.join(contentRoot, '_index.md'), '---\ntitle: Index\n---\n');

  const payload = JSON.stringify([
    {
      slug: 'one',
      frontmatter: { title: 'One', categories: ['Cat'], author: 'Author' },
      content: 'Content one',
    },
  ]);

  const axiosInstance = async () => ({ data: { data: payload } });

  const data = await getBlogJson({
    apiLoadBalancerUrl: 'https://api.example.com',
    axiosInstance,
    contentRoot,
    blogFolder: 'posts',
    publicDir,
    outputJsonDir,
    siteBaseUrl: 'https://example.com',
    authorFallback: 'Fallback',
  });

  assert.equal(data, payload);
  assert.ok(fs.existsSync(path.join(outputJsonDir, 'posts.json')));
  assert.ok(fs.existsSync(path.join(contentRoot, 'posts', 'one.md')));
  assert.ok(fs.existsSync(path.join(publicDir, 'blog-index.json')));

  const index = JSON.parse(fs.readFileSync(path.join(publicDir, 'blog-index.json'), 'utf-8'));
  assert.equal(index[0].url, 'https://example.com/posts/one');
  assert.equal(index[0].author, 'Author');
});

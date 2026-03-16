const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getAllPosts,
  getAllCategories,
  getPaginatedPages,
  isValidPostSlug,
  toCategorySlug,
  toCanonicalUrl,
  buildUrls,
  buildSitemapXml,
  generateSitemap,
} = require('../lib/generate-sitemap');

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fnmb-sitemap-'));

const writeMarkdown = (filePath, frontmatter, content = 'Body') => {
  const fm = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map((entry) => `"${entry}"`).join(', ')}]`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');

  fs.writeFileSync(filePath, `---\n${fm}\n---\n${content}\n`);
};

test('helpers extract posts and categories correctly', () => {
  const root = makeTempDir();
  const postsDir = path.join(root, 'content', 'posts');
  fs.mkdirSync(postsDir, { recursive: true });

  writeMarkdown(path.join(postsDir, 'published.md'), {
    title: 'Published',
    categories: ['Security', 'AI'],
  });
  writeMarkdown(path.join(postsDir, 'custom.md'), {
    title: 'Custom URL',
    url: '/custom-url/',
    categories: ['AI', 'Ops'],
  });
  writeMarkdown(path.join(postsDir, 'draft.md'), {
    title: 'Draft',
    draft: true,
    categories: ['Ignore'],
  });
  writeMarkdown(path.join(postsDir, 'notfound.md'), {
    title: '404',
    layout: '"404"',
    categories: ['Ignore'],
  });
  writeMarkdown(path.join(postsDir, 'default.md'), {
    title: 'Default Placeholder',
    url: '/default1/',
    categories: ['Ignore'],
  });
  writeMarkdown(path.join(postsDir, 'numeric.md'), {
    title: 'Numeric Placeholder',
    url: '/2/',
    categories: ['Ignore'],
  });

  const posts = getAllPosts('posts', { cwd: root });
  assert.equal(posts.length, 2);
  assert.deepEqual(
    posts.map((post) => post.slug).sort(),
    ['custom-url', 'published'],
  );

  const categories = getAllCategories(posts);
  assert.deepEqual(categories.sort(), ['ai', 'ops', 'security']);
});

test('url and xml builders include static, post, category, and pagination urls', () => {
  const urls = buildUrls({
    baseUrl: 'https://example.com',
    posts: [
      { slug: 'a', frontmatter: { categories: ['cat-a'] } },
      { slug: 'b', frontmatter: { categories: ['cat-b'] } },
      { slug: 'c', frontmatter: { categories: [] } },
      { slug: 'd', frontmatter: { categories: [] } },
    ],
    categories: ['cat-a', 'cat-b'],
    staticPages: ['', 'about'],
    postsPerPage: 2,
  });

  assert.ok(urls.includes('https://example.com/'));
  assert.ok(urls.includes('https://example.com/about/'));
  assert.ok(urls.includes('https://example.com/posts/a/'));
  assert.ok(urls.includes('https://example.com/categories/cat-a/'));
  assert.ok(urls.includes('https://example.com/posts/2/'));

  const xml = buildSitemapXml(urls);
  assert.match(xml, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.match(xml, /<loc>https:\/\/example.com\/posts\/a\/<\/loc>/);
});

test('generateSitemap writes sitemap.xml with expected urls', () => {
  const root = makeTempDir();
  const postsDir = path.join(root, 'content', 'posts');
  const publicDir = path.join(root, 'public');
  fs.mkdirSync(postsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  writeMarkdown(path.join(postsDir, 'one.md'), { title: 'One', categories: ['AI'] });
  writeMarkdown(path.join(postsDir, 'two.md'), { title: 'Two', categories: ['Ops'] });
  writeMarkdown(path.join(postsDir, 'three.md'), { title: 'Three', categories: ['Ops'] });

  const outputPath = path.join(publicDir, 'sitemap.xml');
  const cfg = {
    site: { base_url: 'https://example.com' },
    settings: { blog_folder: 'posts', pagination: 2 },
  };

  const result = generateSitemap({
    cfg,
    cwd: root,
    outputPath,
  });

  assert.equal(result.outputPath, outputPath);
  assert.ok(fs.existsSync(outputPath));

  const xml = fs.readFileSync(outputPath, 'utf-8');
  assert.match(xml, /https:\/\/example.com\/posts\/one\//);
  assert.match(xml, /https:\/\/example.com\/categories\/ai\//);
  assert.match(xml, /https:\/\/example.com\/posts\/2\//);

  assert.deepEqual(getPaginatedPages(3, 2), ['posts/2']);
});

test('slug and canonical helpers enforce sitemap-safe urls', () => {
  assert.equal(isValidPostSlug('howtoaddandedithostswiththeassistant'), true);
  assert.equal(isValidPostSlug('default1'), false);
  assert.equal(isValidPostSlug('2'), false);
  assert.equal(toCategorySlug('Advanced Security'), 'advanced-security');
  assert.equal(toCategorySlug('AI'), 'ai');
  assert.equal(toCanonicalUrl('https://example.com/', '/posts/abc/'), 'https://example.com/posts/abc/');
});

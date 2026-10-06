const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getAllPosts,
  getAllCategories,
  getPaginatedPages,
  resolveStaticPages,
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
    categories: ['AI', 'DevOps'],
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
  assert.deepEqual(categories.sort(), ['ai-and-automation', 'cybersecurity', 'devops']);
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
  assert.ok(urls.includes('https://example.com/page/2/'));

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
  writeMarkdown(path.join(postsDir, 'two.md'), { title: 'Two', categories: ['DevOps'] });
  writeMarkdown(path.join(postsDir, 'three.md'), { title: 'Three', categories: ['DevOps'] });

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
  assert.match(xml, /https:\/\/example.com\/categories\/ai-and-automation\//);
  assert.match(xml, /https:\/\/example.com\/page\/2\//);

  assert.deepEqual(getPaginatedPages(3, 2), ['page/2']);
});

test('slug and canonical helpers enforce sitemap-safe urls', () => {
  assert.equal(isValidPostSlug('howtoaddandedithostswiththeassistant'), true);
  assert.equal(isValidPostSlug('default1'), false);
  assert.equal(isValidPostSlug('2'), false);
  assert.equal(toCategorySlug('Advanced Security'), 'advanced-security');
  assert.equal(toCategorySlug('AI'), 'ai');
  assert.equal(toCanonicalUrl('https://example.com/', '/posts/abc/'), 'https://example.com/posts/abc/');
});

test('resolveStaticPages keeps only existing content pages plus root', () => {
  const root = makeTempDir();
  const contentDir = path.join(root, 'content');
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'contact.md'), '---\\ntitle: Contact\\n---\\n');

  const resolved = resolveStaticPages(['', 'about', 'contact'], { cwd: root });
  assert.deepEqual(resolved, ['', 'contact']);
});


test('sitemap category slugs agree with the shared route slugger, including punctuation', () => {
  const { slugify } = require('../lib/utils/slug.cjs');
  const labels = ['SSL/TLS', 'SSL/TLS Security', 'AI & ML', 'C++', 'Café', ' Security '];
  for (const label of labels) assert.equal(toCategorySlug(label), slugify(label));
  const categories = getAllCategories([{frontmatter: {categories: ['SSL/TLS', 'SSL/TLS Security', 'Security']}}]);
  const urls = buildUrls({baseUrl: 'https://example.com', posts: [], categories, postsPerPage: 10});
  assert.ok(urls.includes('https://example.com/categories/tls-and-encryption/'));
  assert.ok(urls.includes('https://example.com/categories/cybersecurity/'));
  assert.ok(!urls.includes('https://example.com/categories/ssl-tls/'));
  assert.ok(!urls.includes('https://example.com/categories/ssl-tls-security/'));
});


test('sitemap generation keeps robots rules and one current sitemap declaration', () => {
  const root = makeTempDir();
  fs.mkdirSync(path.join(root, 'content', 'posts'), {recursive:true});
  fs.mkdirSync(path.join(root, 'public'));
  const robots = path.join(root, 'public', 'robots.txt');
  fs.writeFileSync(robots, 'User-agent: *\nDisallow: /api/*\nSitemap: https://old.example/sitemap.xml\n');
  const options = {cwd:root,outputPath:path.join(root,'public','sitemap.xml'),cfg:{site:{base_url:'https://example.com'},settings:{blog_folder:'posts',pagination:6}}};
  generateSitemap(options);generateSitemap(options);
  const result=fs.readFileSync(robots,'utf8');
  assert.ok(result.includes('Disallow: /api/*'));
  assert.equal((result.match(/^Sitemap:/gm)||[]).length,1);
  assert.ok(result.includes('Sitemap: https://example.com/sitemap.xml'));
});

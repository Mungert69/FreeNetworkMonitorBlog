const test = require('node:test');
const assert = require('node:assert/strict');
const {isPublishedPost, resolvePostSlug} = require('../lib/publication-policy.cjs');
const {buildBlogIndex} = require('../lib/jsonGenerator');

test('exclude templates and drafts, while retaining substantive testing articles', () => {
  for (const slug of ['default', 'default1', 'DEFAULT23', '2']) {
    assert.equal(isPublishedPost({slug,frontmatter:{featured:true}}),false);
  }
  assert.equal(isPublishedPost({slug:'article',frontmatter:{url:'/default1/'}}),false);
  assert.equal(isPublishedPost({slug:'article',frontmatter:{draft:true}}),false);
  assert.equal(isPublishedPost({slug:'article',frontmatter:{layout:'404'}}),false);
  assert.equal(isPublishedPost({slug:'titleintegrationtestblogfocusautomatedtesting',frontmatter:{categories:['Test']}}),true);
  assert.equal(isPublishedPost({slug:'10essentialnetworkmonitoringtoolsfor2024'}),true);
  assert.equal(resolvePostSlug('file',{url:'/custom-url/'}),'custom-url');
});

test('public blog index follows the same policy without modifying imported posts', () => {
  const posts=[{slug:'default1',frontmatter:{}},{slug:'published',frontmatter:{url:'/custom-url/'}},{slug:'draft',frontmatter:{draft:true}}];
  const before=JSON.stringify(posts);
  const index=buildBlogIndex(posts,{siteBaseUrl:'https://example.com'});
  assert.deepEqual(index.map(p=>p.slug),['custom-url']);
  assert.equal(index[0].url,'https://example.com/posts/custom-url');
  assert.equal(JSON.stringify(posts),before);
});

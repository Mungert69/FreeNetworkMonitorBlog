const test = require('node:test');
const assert = require('node:assert/strict');
const parse = require('../lib/frontmatter');

test('post metadata preserves dates, lists, booleans, quoted text and body', () => {
  const { data, content } = parse('---\ntitle: "Quantum: ready"\ndate: 2026-10-06\ndraft: false\ncategories: [Security, AI]\ndescription: |\n  First line\n  Second line\n---\n# Body\n');
  assert.equal(data.title, 'Quantum: ready');
  assert.equal(data.date.toISOString(), '2026-10-06T00:00:00.000Z');
  assert.equal(data.draft, false);
  assert.deepEqual(data.categories, ['Security', 'AI']);
  assert.equal(data.description, 'First line\nSecond line\n');
  assert.equal(content, '# Body\n');
});

test('documents without metadata retain their full content', () => {
  const body = '# Plain page\n\n```yaml\nexample: true\n```\n';
  const result = parse(body);
  assert.deepEqual(result.data, {});
  assert.equal(result.content, body);
});

test('malformed YAML and executable YAML tags are rejected', () => {
  assert.throws(() => parse('---\ncategories: [Security\n---\nBody'), /unexpected|end|flow/i);
  assert.throws(() => parse('---\nvalue: !!js/function "function () { return 1; }"\n---\nBody'), /unknown tag/i);
});

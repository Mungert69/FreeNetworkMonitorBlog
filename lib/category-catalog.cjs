const catalogue = require('../config/blog-categories.json');
const { slugify } = require('./utils/slug.cjs');
const labels = Object.keys(catalogue);
const aliases = new Map();
for (const [label, names] of Object.entries(catalogue)) {
  for (const name of [label, ...names]) aliases.set(name.trim().toLowerCase(), label);
}

// Categories are editorial topics, not an unlimited list of imported tags.
function normalizeCategories(categories = []) {
  const normalized = [];
  for (const value of categories) {
    const name = String(value).trim();
    // The old backend used Test for missing categories. Never publish its archive.
    if (!name || name.toLowerCase() === 'test') continue;
    const label = aliases.get(name.toLowerCase());
    if (!label) throw new Error(`Unknown blog category "${name}". Map it to an existing topic in config/blog-categories.json.`);
    if (!normalized.includes(label)) normalized.push(label);
  }
  return normalized.length ? normalized : ['Network Monitoring'];
}

function categoryRedirects() {
  const redirects = new Map();
  for (const [label, names] of Object.entries(catalogue)) {
    const target = slugify(label);
    for (const name of names) {
      const source = slugify(name);
      if (source !== target) redirects.set(source, target);
    }
  }
  // These legacy sitemap aliases predate the category consolidation.
  redirects.set('ssl-tls', slugify('TLS and Encryption'));
  redirects.set('ssl-tls-security', slugify('TLS and Encryption'));
  // Removed test content has no substantive replacement category.
  redirects.set('test', '');
  return [...redirects].sort(([a], [b]) => a.localeCompare(b));
}
module.exports = { labels, normalizeCategories, categoryRedirects };

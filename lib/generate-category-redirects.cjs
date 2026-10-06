const fs = require('node:fs');
const path = require('node:path');
const { categoryRedirects } = require('./category-catalog.cjs');
function renderCategoryRedirects() {
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return '# Generated from config/blog-categories.json. Do not edit.\n' +
    categoryRedirects().map(([source, target]) =>
      `RewriteRule ^categories/${escape(source)}/?$ /categories/${target ? `${target}/` : ''} [R=301,L]`
    ).join('\n') + '\n';
}
function generateCategoryRedirects(root = process.cwd()) {
  const output = path.join(root, 'out', '.category-redirects.conf');
  fs.writeFileSync(output, renderCategoryRedirects());
  // Every redirect must have a real destination in this export.
  for (const [, target] of categoryRedirects()) {
    if (!fs.existsSync(path.join(root, 'out', 'categories', target, 'index.html'))) {
      throw new Error(`Category redirect target was not exported: ${target || 'category index'}`);
    }
  }
  console.log(`Generated and verified ${categoryRedirects().length} permanent category redirects.`);
}
if (require.main === module) generateCategoryRedirects();
module.exports = { renderCategoryRedirects, generateCategoryRedirects };

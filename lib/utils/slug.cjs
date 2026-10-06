const { slug } = require("github-slugger");

// Shared by category routes, rendered links and the sitemap. Preserve the
// existing page URLs: github-slugger removes '/' rather than adding a hyphen.
function slugify(content) {
  return content ? slug(content) : null;
}

module.exports = { slugify };

// Presentation-only policy: retain original database/imported content, but never
// publish template slugs. Do not filter titles/categories mentioning testing.
const placeholderSlugPattern = /^(?:default\d*|\d+)$/i;

function isValidPostSlug(slug) {
  return Boolean(slug) && !placeholderSlugPattern.test(String(slug));
}

function resolvePostSlug(slug, frontmatter = {}) {
  return frontmatter.url ? String(frontmatter.url).replace(/\//g, "") : slug;
}

function isPublishedPost({ slug, frontmatter = {} } = {}) {
  return !frontmatter.draft && frontmatter.layout !== "404" &&
    isValidPostSlug(resolvePostSlug(slug, frontmatter));
}

module.exports = { isValidPostSlug, resolvePostSlug, isPublishedPost };

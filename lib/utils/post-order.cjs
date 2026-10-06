function postTime(post) {
  const value = post?.frontmatter?.date;
  if (!value) return -Infinity;
  // Imported dates have no zone. Interpret those consistently as UTC.
  const text = String(value);
  const time = Date.parse(/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d/.test(text) && !/(?:Z|[+-]\d\d:\d\d)$/i.test(text) ? `${text.replace(' ', 'T')}Z` : text);
  return Number.isFinite(time) ? time : -Infinity;
}
function sortByDate(posts) {
  return [...posts].sort((a, b) => {
    const at = postTime(a), bt = postTime(b);
    if (at !== bt) return at > bt ? -1 : 1;
    return String(a.slug || '').localeCompare(String(b.slug || ''));
  });
}
module.exports = { sortByDate };

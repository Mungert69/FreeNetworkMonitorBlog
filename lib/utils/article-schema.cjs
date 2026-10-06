function absoluteHttpUrl(value, base) {
  if (!value) return undefined;
  try {
    const url = new URL(value, base);
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
function sourceDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return undefined;
  // Preserve the supplied timezone; do not invent one or a modification date.
  return value instanceof Date ? value.toISOString() : String(value);
}
function articleSchema({title, description, date, modified, image, canonical, author, siteName, baseUrl}) {
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: title, description, url: canonical,
    mainEntityOfPage: {'@type': 'WebPage', '@id': canonical},
    ...(sourceDate(date) ? {datePublished: sourceDate(date)} : {}),
    ...(sourceDate(modified) ? {dateModified: sourceDate(modified)} : {}),
    ...(absoluteHttpUrl(image, baseUrl) ? {image: [absoluteHttpUrl(image, baseUrl)]} : {}),
    ...(author ? {author: {'@type': 'Person', name: author}} : {}),
    publisher: {'@type': 'Organization', name: siteName, url: baseUrl},
  };
}
const serializeJsonLd = data => JSON.stringify(data).replace(/</g, '\\u003c');
module.exports = {articleSchema, serializeJsonLd};

const DEFAULT_SUMMARY_LENGTH = 280;

export const toPostCardData = (post, summaryLength = DEFAULT_SUMMARY_LENGTH) => {
  const frontmatter = post?.frontmatter || {};
  const categories = Array.isArray(frontmatter.categories)
    ? frontmatter.categories
    : [];
  const length = Number(summaryLength) || DEFAULT_SUMMARY_LENGTH;

  return {
    slug: post?.slug || "",
    frontmatter: {
      title: frontmatter.title || "",
      date: frontmatter.date || null,
      image: frontmatter.image || "",
      categories,
      featured: Boolean(frontmatter.featured),
      draft: Boolean(frontmatter.draft),
    },
    content: (post?.content || "").slice(0, length),
  };
};

export const toPostCardDataList = (posts, summaryLength = DEFAULT_SUMMARY_LENGTH) =>
  (Array.isArray(posts) ? posts : []).map((post) =>
    toPostCardData(post, summaryLength)
  );

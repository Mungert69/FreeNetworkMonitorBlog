import Base from "@layouts/Baseof";
import { slugify } from "@lib/utils/textConverter";
import Post from "@partials/Post";
import { useSearchContext } from "context/state";
import { useRouter } from "next/router";

const SearchPage = () => {
  const router = useRouter();
  const { query } = router;
  const keyword = slugify(query.key || "");
  const { posts } = useSearchContext();
  const normalizedPosts = Array.isArray(posts) ? posts : [];

  const searchResults = normalizedPosts.filter((product) => {
    const frontmatter = product?.frontmatter || {};
    if (frontmatter.draft) {
      return false;
    }
    if (slugify(frontmatter.title || "").includes(keyword)) {
      return product;
    } else if (
      (Array.isArray(frontmatter.categories) ? frontmatter.categories : []).find((category) =>
        slugify(category).includes(keyword)
      )
    ) {
      return product;
    } else if (slugify(product.content).includes(keyword)) {
      return product;
    }
  });

  return (
    <Base title={`Search results for ${query.key}`}>
      <div className="section">
        <div className="container">
          <h1 className="h2 mb-8 text-center">
            Search results for <span className="text-primary">{query.key}</span>
          </h1>
          {searchResults.length > 0 ? (
            <div className="row">
              {searchResults.map((post, i) => (
                <div key={`key-${i}`} className="col-12 mb-8 sm:col-6">
                  <Post post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-h3 shadow">
              No Search Found
            </div>
          )}
        </div>
      </div>
    </Base>
  );
};

export default SearchPage;

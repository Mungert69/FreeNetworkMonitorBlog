import config from "@config/config.json";
import PostSingle from "@layouts/PostSingle";
import { getSinglePage } from "@lib/contentParser";
import { getTaxonomy } from "@lib/taxonomyParser";
import { toPostCardDataList } from "@lib/utils/postPayload";
import parseMDX from "@lib/utils/mdxParser";
import { slugify } from "@lib/utils/textConverter";
const { base_url } = config.site;
const { blog_folder } = config.settings;

// post single layout
const Article = ({
  post,
  mdxContent,
  slug,
  allCategories,
  relatedPosts,
  posts,
}) => {
  const { frontmatter, content } = post;
  const canonical = `${base_url}/posts/${slug}`;

  return (
    <PostSingle
      frontmatter={frontmatter}
      content={content}
      mdxContent={mdxContent}
      slug={slug}
      canonical={canonical}
      allCategories={allCategories}
      relatedPosts={relatedPosts}
      posts={posts}
    />
  );
};

// get post single slug
export const getStaticPaths = () => {
  const allSlug = getSinglePage(`content/${blog_folder}`);
  const paths = allSlug.map((item) => ({
    params: {
      single: item.slug,
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

// get post single content
export const getStaticProps = async ({ params }) => {
  const { single } = params;
  const allPosts = getSinglePage(`content/${blog_folder}`);
  const post = allPosts.find((p) => p.slug == single);
  const mdxContent = await parseMDX(post.content);
  // related posts
  const relatedPosts = allPosts
    .filter((p) => p.slug !== single)
    .filter((p) =>
    post.frontmatter.categories.some((cate) =>
      p.frontmatter.categories.includes(cate)
    )
  );
  const relatedPostCards = toPostCardDataList(relatedPosts);
  const postCards = toPostCardDataList(allPosts);

  //all categories
  const categories = getTaxonomy(`content/${blog_folder}`, "categories");
  const categoriesWithPostsCount = categories
    .map((category) => {
      const filteredPosts = allPosts.filter((post) =>
        post.frontmatter.categories.some(
          (postCategory) => slugify(postCategory) === category
        )
      );
      return {
        name: category,
        posts: filteredPosts.length,
      };
    })
    .filter((category) => category.posts > 0);
  return {
    props: {
      post: post,
      mdxContent: mdxContent,
      slug: single,
      allCategories: categoriesWithPostsCount,
      relatedPosts: relatedPostCards,
      posts: postCards,
    },
  };
};

export default Article;

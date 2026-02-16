import config from "@config/config.json";
import Base from "@layouts/Baseof";
import { getTaxonomy } from "@lib/taxonomyParser";
import { toPostCardDataList } from "@lib/utils/postPayload";
import { humanize, markdownify, slugify } from "@lib/utils/textConverter";
import Link from "next/link";
const { blog_folder } = config.settings;
import { getSinglePage } from "@lib/contentParser";
import { FaFolder } from "react-icons/fa";
import CategorySearch from "@layouts/components/CategorySearch";

const Categories = ({ categories, posts }) => {
  return (
    <Base title={"categories"}>
      <CategorySearch posts={posts} />
      <section className="section pt-0">
        {markdownify(
          "Categories",
          "h1",
          "h2 mb-16 bg-theme-light dark:bg-darkmode-theme-dark py-12 text-center lg:text-[55px]"
        )}
        <div className="container pt-12 text-center">
          <ul className="row">
            {categories.map((category, i) => (
              <li
                key={`category-${i}`}
                className="mt-4 block lg:col-4 xl:col-3"
              >
                <Link
                  href={`/categories/${category.name}`}
                  className="flex w-full items-center justify-center rounded-lg bg-theme-light px-4 py-4 font-bold text-dark transition hover:bg-primary hover:text-white  dark:bg-darkmode-theme-dark dark:text-darkmode-light dark:hover:bg-primary dark:hover:text-white"
                >
                  <FaFolder className="mr-1.5" />
                  {humanize(category.name)} ({category.posts})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Base>
  );
};

export default Categories;

export const getStaticProps = () => {
  const allPosts = getSinglePage(`content/${blog_folder}`);
  const posts = toPostCardDataList(allPosts);
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
      categories: categoriesWithPostsCount,
      posts,
    },
  };
};

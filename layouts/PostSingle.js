import config from "@config/config.json";
import Base from "@layouts/Baseof";
import dateFormat from "@lib/utils/dateFormat";
import { markdownify } from "@lib/utils/textConverter";
import { DiscussionEmbed } from "disqus-react";
import { MDXRemote } from "next-mdx-remote";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { FaRegCalendar, FaUserAlt } from "react-icons/fa";
import Post from "./partials/Post";
import Sidebar from "./partials/Sidebar";
import shortcodes from "./shortcodes/all";
const { disqus } = config;
const { meta_author } = config.metadata;

const PostSingle = ({
  frontmatter,
  content,
  mdxContent,
  slug,
  canonical,
  posts,
  allCategories,
  relatedPosts,
}) => {
  let { description, title, date, image, categories } = frontmatter;
  description = description ? description : content.slice(0, 120);

  const { theme } = useTheme();

  return (
    <Base title={title} description={description} canonical={canonical}>
      <section className="section single-blog mt-6">
        <div className="container">
          <div className="row">
            <div className="lg:col-8">
              <article>
                <div className="relative">
                  {image && (
                    <Image
                      src={image}
                      height="500"
                      width="1000"
                      alt={title}
                      className="rounded-lg"
                    />
                  )}
                  <ul className="absolute top-3 left-2 flex flex-wrap items-center">
                    {categories.map((tag, index) => (
                      <li
                        className="mx-2 inline-flex h-7 rounded-[35px] bg-primary px-3 text-white"
                        key={"tag-" + index}
                      >
                        <Link
                          className="capitalize"
                          href={`/categories/${tag.replace(" ", "-")}`}
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                {markdownify(title, "h1", "lg:text-[42px] mt-16")}
                <ul className="flex items-center space-x-4">
                  <li>
                    <Link
                      className="inline-flex items-center font-secondary text-xs leading-3"
                      href="/about"
                    >
                      <FaUserAlt className="mr-1.5" />
                      {meta_author}
                    </Link>
                  </li>
                  <li className="inline-flex items-center font-secondary text-xs leading-3">
                    <FaRegCalendar className="mr-1.5" />
                    {dateFormat(date)}
                  </li>
                </ul>
                <div className="content mb-16">
                  <MDXRemote {...mdxContent} components={shortcodes} />
                </div>
              </article>

              {/* Render Q&A section if questions and answers exist and are arrays of equal length */}
              {Array.isArray(frontmatter.questions) &&
                Array.isArray(frontmatter.answers) &&
                frontmatter.questions.length === frontmatter.answers.length &&
                frontmatter.questions.length > 0 && (
                  <div className="mt-16 p-6 rounded border border-border dark:border-darkmode-border bg-theme-light dark:bg-darkmode-theme-dark">
                    <h2 className="section-title mb-6">Frequently Asked Questions</h2>
                    <ul>
                      {frontmatter.questions.map((question, idx) => (
                        <li key={`qa-${idx}`} className="mb-6">
                          <h3 className="font-bold mb-2">{question}</h3>
                          <p>{frontmatter.answers[idx]}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="mt-16">
                {disqus.enable && (
                  <DiscussionEmbed
                    key={theme}
                    shortname={disqus.shortname}
                    config={config.disqus.settings}
                  />
                )}
              </div>
            </div>
            <Sidebar
              posts={posts.filter((post) => post.slug !== slug)}
              categories={allCategories}
            />
          </div>
        </div>

        {/* Related posts */}
        <div className="container mt-20">
          <h2 className="section-title">Related Posts</h2>
          <div className="row mt-16">
            {relatedPosts.slice(0, 3).map((post, index) => (
              <div key={"post-" + index} className="mb-12 lg:col-4">
                <Post post={post} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </Base>
  );
};

export default PostSingle;

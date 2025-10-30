import config from "@config/config.json";
import Base from "@layouts/Baseof";
import dateFormat from "@lib/utils/dateFormat";
import { markdownify } from "@lib/utils/textConverter";
import { DiscussionEmbed } from "disqus-react";
import { MDXRemote } from "next-mdx-remote";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { FaRegCalendar, FaUserAlt } from "react-icons/fa";
import Post from "./partials/Post";
import Sidebar from "./partials/Sidebar";
import shortcodes from "./shortcodes/all";
import { slugify } from "@lib/utils/textConverter";
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
  // DEBUG: Log the frontmatter to check for questions/answers
  if (typeof window !== "undefined") {
    console.log("Frontmatter in PostSingle:", frontmatter);
  }
  let { description, title, date, image, categories } = frontmatter;
  description = description ? description : content.slice(0, 120);

  const { theme } = useTheme();

  // Generate JSON-LD FAQ schema if Q&A present
  let faqJsonLd = null;
  if (
    Array.isArray(frontmatter.questions) &&
    Array.isArray(frontmatter.answers) &&
    frontmatter.questions.length === frontmatter.answers.length &&
    frontmatter.questions.length > 0
  ) {
    const mainEntity = frontmatter.questions.map((q, i) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": frontmatter.answers[i]
      }
    }));
    faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity
    };
  }

  return (
    <Base title={title} description={description} canonical={canonical}>
      {faqJsonLd && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        </Head>
      )}
      <section className="section single-blog mt-6">
        <div className="container">
          <div className="row">
            <div className="lg:col-8">
              <article>
                <div className="relative">
                  {image && (
                    <div className="flex justify-center my-6">
                      <Image
                        src={
                          image.startsWith("http")
                            ? image
                            : `${config.site.base_url}${image}`
                        }
                        height={350}
                        width={350}
                        alt={title}
                        className="rounded-lg shadow-md max-w-[90vw] object-contain"
                        style={{ maxHeight: "350px" }}
                        priority={true}
                      />
                    </div>
                  )}
                  <ul className="absolute top-3 left-2 flex flex-wrap items-center">
                    {categories.map((tag, index) => (
                      <li
                        className="mx-2 inline-flex h-7 rounded-full bg-primary/80 px-3 text-white shadow-md backdrop-blur-sm border border-white/30"
                        key={"tag-" + index}
                      >
                        <Link
                          className="capitalize"
                          href={`/categories/${slugify(tag)}`}
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

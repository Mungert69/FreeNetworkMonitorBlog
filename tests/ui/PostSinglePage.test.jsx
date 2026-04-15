// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const mockData = vi.hoisted(() => ({
  allPosts: [
    {
      slug: 'alpha-post',
      frontmatter: { title: 'Alpha', categories: ['Cat One', 'Cat Two'] },
      content: 'Alpha content',
    },
    {
      slug: 'beta-post',
      frontmatter: { title: 'Beta', categories: ['Cat One'] },
      content: 'Beta content',
    },
    {
      slug: 'gamma-post',
      frontmatter: { title: 'Gamma', categories: ['Cat Three'] },
      content: 'Gamma content',
    },
  ],
}));

vi.mock('@config/config.json', () => {
  const cfg = {
    site: { base_url: 'https://example.com' },
    settings: { blog_folder: 'posts' },
  };
  return { default: cfg, ...cfg };
});

vi.mock('@lib/contentParser', () => ({
  getSinglePage: vi.fn(() => mockData.allPosts),
}));

vi.mock('@lib/taxonomyParser', () => ({
  getTaxonomy: vi.fn(() => ['cat-one', 'cat-two', 'cat-three']),
}));

vi.mock('@lib/utils/mdxParser', () => ({
  default: vi.fn(async (content) => `serialized:${content}`),
}));

vi.mock('@lib/utils/postPayload', () => ({
  toPostCardDataList: vi.fn((posts) => posts.map((post) => ({
    slug: post.slug,
    frontmatter: post.frontmatter,
    content: post.content,
  }))),
}));

const postSingleMock = vi.hoisted(() => ({ fn: vi.fn(() => null) }));
vi.mock('@layouts/PostSingle', () => ({ default: postSingleMock.fn }));

import Article, { getStaticPaths, getStaticProps } from '../../pages/posts/[single].jsx';

describe('pages/posts/[single]', () => {
  it('builds static paths from post slugs', () => {
    const result = getStaticPaths();

    expect(result.fallback).toBe(false);
    expect(result.paths).toEqual([
      { params: { single: 'alpha-post' } },
      { params: { single: 'beta-post' } },
      { params: { single: 'gamma-post' } },
    ]);
  });

  it('builds static props with mdx, related posts, and category counts', async () => {
    const result = await getStaticProps({ params: { single: 'alpha-post' } });
    const props = result.props;

    expect(props.slug).toBe('alpha-post');
    expect(props.post.slug).toBe('alpha-post');
    expect(props.mdxContent).toBe('serialized:Alpha content');

    expect(props.relatedPosts).toHaveLength(1);
    expect(props.relatedPosts[0].slug).toBe('beta-post');

    expect(props.posts).toHaveLength(3);
    expect(props.allCategories).toEqual([
      { name: 'cat-one', posts: 2 },
      { name: 'cat-two', posts: 1 },
      { name: 'cat-three', posts: 1 },
    ]);
  });

  it('passes canonical, slug, and related posts to PostSingle layout', () => {
    const element = Article({
      post: mockData.allPosts[0],
      mdxContent: 'serialized:Alpha content',
      slug: 'alpha-post',
      allCategories: [{ name: 'cat-one', posts: 2 }],
      relatedPosts: [mockData.allPosts[1]],
      posts: mockData.allPosts,
    });

    expect(element.type).toBe(postSingleMock.fn);
    expect(element.props.canonical).toBe('https://example.com/posts/alpha-post/');
    expect(element.props.slug).toBe('alpha-post');
    expect(element.props.relatedPosts).toHaveLength(1);
    expect(element.props.allCategories).toHaveLength(1);
  });
});

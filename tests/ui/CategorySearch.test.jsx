import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CategorySearch from '@layouts/components/CategorySearch';

vi.mock('@partials/Post', () => ({
  default: ({ post }) => <div data-testid="post-card">{post.frontmatter?.title || post.slug}</div>,
}));

const createJsonResponse = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(payload),
});

const posts = [
  {
    slug: 'post-one',
    frontmatter: { title: 'Post One', categories: ['ai'] },
    content: 'Content for first post',
  },
];

describe('CategorySearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('loads config and renders matched post result from semantic search', async () => {
    global.fetch
      .mockResolvedValueOnce(createJsonResponse({ apiLoadBalancerUrl: 'https://api.example.com' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          data: {
            hits: [
              {
                input: 'Post One',
                output: 'Matched output',
                metadata: { slug: 'post-one', title: 'Post One' },
              },
            ],
          },
        }),
      );

    render(<CategorySearch posts={posts} />);

    const input = await screen.findByPlaceholderText(/try typing/i);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^search$/i })).toBeEnabled();
    });

    fireEvent.change(input, { target: { value: 'post one' } });
    fireEvent.submit(input.closest('form'));

    expect(await screen.findByTestId('post-card')).toHaveTextContent('Post One');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    expect(global.fetch.mock.calls[1][0]).toBe('https://api.example.com/Search/Query');
    const requestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
    expect(requestBody).toMatchObject({
      queryText: 'post one',
      indexName: 'blogs',
      vectorSearchMode: 'content',
    });
  });

  it('shows no-match message when search returns no hits', async () => {
    global.fetch
      .mockResolvedValueOnce(createJsonResponse({ apiLoadBalancerUrl: 'https://api.example.com' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          data: { hits: [] },
        }),
      );

    render(<CategorySearch posts={posts} />);

    const input = await screen.findByPlaceholderText(/try typing/i);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^search$/i })).toBeEnabled();
    });

    fireEvent.change(input, { target: { value: 'no hit phrase' } });
    fireEvent.submit(input.closest('form'));

    expect(await screen.findByText(/No matches found for/i)).toBeInTheDocument();
  });

  it('renders fallback card when semantic hit cannot be mapped to a local post', async () => {
    global.fetch
      .mockResolvedValueOnce(createJsonResponse({ apiLoadBalancerUrl: 'https://api.example.com' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          data: {
            hits: [
              {
                input: 'Remote match',
                output: 'Remote summary',
                metadata: {
                  title: 'Remote Title',
                  summary: 'Fallback summary text',
                  url: 'https://remote.example.com/posts/remote',
                  categories: ['remote', 'news'],
                },
              },
            ],
          },
        }),
      );

    render(<CategorySearch posts={[]} />);

    const input = await screen.findByPlaceholderText(/try typing/i);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^search$/i })).toBeEnabled();
    });

    fireEvent.change(input, { target: { value: 'remote' } });
    fireEvent.submit(input.closest('form'));

    expect(await screen.findByRole('link', { name: 'Remote Title' })).toHaveAttribute(
      'href',
      'https://remote.example.com/posts/remote',
    );
    expect(screen.getByText('Fallback summary text')).toBeInTheDocument();
    expect(screen.getByText('remote, news')).toBeInTheDocument();
  });
});

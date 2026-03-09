import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Pagination from '@layouts/components/Pagination';

describe('Pagination', () => {
  it('renders disabled previous and linked next on first page', () => {
    render(<Pagination currentPage={1} totalPages={3} />);

    const previous = screen.getByText('Previous');
    expect(previous.closest('a')).toBeNull();

    const nextLink = screen.getByText('Next').closest('a');
    expect(nextLink).toHaveAttribute('href', '/page/2');
  });

  it('builds section-aware links and marks current page', () => {
    render(<Pagination section="posts" currentPage={2} totalPages={4} />);

    const previousLink = screen.getByText('Previous').closest('a');
    expect(previousLink).toHaveAttribute('href', '/posts');

    const nextLink = screen.getByText('Next').closest('a');
    expect(nextLink).toHaveAttribute('href', '/posts/page/3');

    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
  });

  it('shows ellipsis for larger page ranges', () => {
    render(<Pagination section="posts" currentPage={6} totalPages={12} />);

    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
    expect(screen.getByText('1').closest('a')).toHaveAttribute('href', '/posts');
    expect(screen.getByText('12').closest('a')).toHaveAttribute('href', '/posts/page/12');
  });
});

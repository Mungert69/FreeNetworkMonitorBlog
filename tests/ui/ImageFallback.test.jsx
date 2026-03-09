import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ImageFallback from '@layouts/components/ImageFallback';

describe('ImageFallback', () => {
  it('renders source image and switches to fallback on error', async () => {
    render(
      <ImageFallback
        src="/primary.png"
        fallback="/fallback.png"
        alt="hero"
        width={100}
        height={50}
      />,
    );

    const image = screen.getByAltText('hero');
    expect(image).toHaveAttribute('src', '/primary.png');

    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/fallback.png');
    });
  });

  it('resets to latest src when prop changes', () => {
    const { rerender } = render(
      <ImageFallback
        src="/first.png"
        fallback="/fallback.png"
        alt="dynamic"
        width={100}
        height={50}
      />,
    );

    const image = screen.getByAltText('dynamic');
    expect(image).toHaveAttribute('src', '/first.png');

    rerender(
      <ImageFallback
        src="/second.png"
        fallback="/fallback.png"
        alt="dynamic"
        width={100}
        height={50}
      />,
    );

    expect(image).toHaveAttribute('src', '/second.png');
  });
});

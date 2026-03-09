import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) =>
    React.createElement(
      'a',
      {
        href:
          typeof href === 'string'
            ? href
            : href?.pathname || href?.toString?.() || '',
        ...props,
      },
      children,
    ),
}));

vi.mock('next/image', () => ({
  default: (props) => React.createElement('img', props),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

import { describe, expect, it } from 'vitest';
import { withListQuerySearch } from '../src/lib/api/list-query';

describe('withListQuerySearch', () => {
  it('sets a trimmed search query and clears the cursor', () => {
    expect(
      withListQuerySearch(
        {
          cursor: 'cursor_1',
          limit: 10,
        },
        '  design  ',
      ),
    ).toEqual({
      q: 'design',
      cursor: undefined,
      limit: 10,
    });
  });

  it('removes an empty search query and preserves the limit', () => {
    expect(
      withListQuerySearch(
        {
          cursor: 'cursor_1',
          limit: 10,
          q: 'design',
        },
        '   ',
      ),
    ).toEqual({
      q: undefined,
      cursor: undefined,
      limit: 10,
    });
  });

  it('returns the current search object when the normalized query is unchanged', () => {
    const current = {
      cursor: 'cursor_1',
      limit: 10,
      q: 'design',
    };

    expect(withListQuerySearch(current, ' design ')).toBe(current);
  });
});

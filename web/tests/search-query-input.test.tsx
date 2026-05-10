import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchQueryInput } from '../src/components/search-query-input';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SearchQueryInput', () => {
  it('debounces search changes', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(
      <SearchQueryInput
        onSearchChange={onSearchChange}
        placeholder="Search workspaces..."
      />,
    );

    fireEvent.change(screen.getByLabelText('Search workspaces...'), {
      target: { value: 'design' },
    });

    expect(onSearchChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(onSearchChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSearchChange).toHaveBeenCalledWith('design');
  });

  it('clears an active search immediately', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(
      <SearchQueryInput
        onSearchChange={onSearchChange}
        placeholder="Search workspaces..."
        value="design"
      />,
    );

    fireEvent.click(screen.getByLabelText('Clear search'));

    expect(onSearchChange).toHaveBeenCalledWith('');
  });
});

import { SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { cn } from '#/lib/utils';

type SearchQueryInputProps = {
  value?: string;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  onSearchChange: (q: string) => void;
};

export function SearchQueryInput({
  value = '',
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  onSearchChange,
}: SearchQueryInputProps) {
  const [draft, setDraft] = useState(value);
  const skipNextDebounceRef = useRef(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) {
      skipNextDebounceRef.current = false;
      return;
    }

    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onSearchChange(draft);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, draft, onSearchChange, value]);

  const clearSearch = () => {
    skipNextDebounceRef.current = true;
    setDraft('');

    if (value !== '') {
      onSearchChange('');
    }
  };

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
      <Input
        aria-label={placeholder}
        className="pr-9 pl-8"
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        role="searchbox"
        type="text"
        value={draft}
      />
      {draft ? (
        <Button
          aria-label="Clear search"
          className="-translate-y-1/2 absolute top-1/2 right-1 size-7"
          onClick={clearSearch}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

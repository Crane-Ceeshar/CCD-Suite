import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from '../primitives/input';
import { Button } from '../primitives/button';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    return (
      <div className={cn('relative', className)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          className="pl-9 pr-9"
          value={value}
          {...props}
        />
        {value && onClear && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };

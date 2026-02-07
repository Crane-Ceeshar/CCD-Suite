'use client';

import * as React from 'react';
import { SearchInput, Card, CardContent } from '@ccd/ui';
import { Users, Building2, DollarSign, Loader2 } from 'lucide-react';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface SearchResult {
  type: 'contact' | 'company' | 'deal';
  id: string;
  label: string;
  subtitle?: string;
}

export function CrmSearch() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [contacts, companies, deals] = await Promise.all([
          apiGet<{ id: string; first_name: string; last_name: string; email: string | null }[]>(
            `/api/crm/contacts?search=${encodeURIComponent(query)}&limit=5`
          ),
          apiGet<{ id: string; name: string; industry: string | null }[]>(
            `/api/crm/companies?search=${encodeURIComponent(query)}&limit=5`
          ),
          apiGet<{ id: string; title: string; company: { name: string } | null }[]>(
            `/api/crm/deals?search=${encodeURIComponent(query)}&limit=5`
          ),
        ]);

        const all: SearchResult[] = [
          ...contacts.data.map((c) => ({
            type: 'contact' as const,
            id: c.id,
            label: `${c.first_name} ${c.last_name}`,
            subtitle: c.email ?? undefined,
          })),
          ...companies.data.map((c) => ({
            type: 'company' as const,
            id: c.id,
            label: c.name,
            subtitle: c.industry ?? undefined,
          })),
          ...deals.data.map((d) => ({
            type: 'deal' as const,
            id: d.id,
            label: d.title,
            subtitle: d.company?.name ?? undefined,
          })),
        ];

        setResults(all);
        setOpen(all.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const icons = {
    contact: <Users className="h-3.5 w-3.5" />,
    company: <Building2 className="h-3.5 w-3.5" />,
    deal: <DollarSign className="h-3.5 w-3.5" />,
  };

  const links = {
    contact: (id: string) => `/crm/contacts/${id}`,
    company: (id: string) => `/crm/companies/${id}`,
    deal: (id: string) => `/crm/deals`,
  };

  return (
    <div className="relative">
      <SearchInput
        className="w-full"
        placeholder="Search contacts, companies, deals..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => { setQuery(''); setOpen(false); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (
        <Card className="absolute top-full mt-1 w-full z-50 shadow-lg max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={links[result.type](result.id)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {icons[result.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.label}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 capitalize">
                      {result.type}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

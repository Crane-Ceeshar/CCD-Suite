/**
 * Human-readable CRM data export utility.
 *
 * – Strips internal / Supabase-specific fields (id, tenant_id, created_by, …)
 * – Flattens nested FK objects  (company: {id, name} → company_name: "Acme")
 * – Supports CSV and JSON output
 */

/* ------------------------------------------------------------------ */
/*  Internal field blocklist                                           */
/* ------------------------------------------------------------------ */

const EXCLUDED_FIELDS = new Set([
  'id',
  'tenant_id',
  'created_by',
  'updated_at',
  'metadata',
  'sort_order',
  'position',
  'pipeline_id',
]);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function humanLabel(key: string): string {
  return key
    .replace(/_id$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Flatten one row: expand FK sub-objects and strip excluded keys.
 */
function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (EXCLUDED_FIELDS.has(key)) continue;

    // Nested FK object → flatten to human-readable name
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      // If object has 'name' → use it (companies, stages)
      if ('name' in obj) {
        out[humanLabel(key)] = obj.name ?? '';
        continue;
      }
      // If object has 'first_name' + 'last_name' → combine (contacts)
      if ('first_name' in obj || 'last_name' in obj) {
        const first = (obj.first_name as string) ?? '';
        const last = (obj.last_name as string) ?? '';
        out[humanLabel(key)] = `${first} ${last}`.trim();
        continue;
      }
      // Otherwise skip sub-objects with only 'id'
      if (Object.keys(obj).length === 1 && 'id' in obj) continue;
      // Fallback: stringify
      out[humanLabel(key)] = JSON.stringify(obj);
      continue;
    }

    // Skip raw FK id fields that have a corresponding object already processed
    if (key.endsWith('_id') && key !== 'stage_id') {
      // If we already flattened the FK object above, skip the raw id
      const fkKey = key.replace(/_id$/, '');
      if (fkKey in row && row[fkKey] && typeof row[fkKey] === 'object') continue;
    }

    out[humanLabel(key)] = value ?? '';
  }

  return out;
}

/* ------------------------------------------------------------------ */
/*  CSV builder                                                        */
/* ------------------------------------------------------------------ */

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(',')),
  ];
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export type ExportFormat = 'csv' | 'json';

/**
 * Export CRM data as a downloadable file.
 *
 * @param entity  – Used for the filename (e.g. "contacts")
 * @param data    – Raw rows from the API (may contain nested FK objects & internal IDs)
 * @param format  – 'csv' or 'json'
 */
export function exportCrmData(
  entity: string,
  data: Record<string, unknown>[],
  format: ExportFormat = 'csv',
) {
  if (!data || data.length === 0) return;

  const cleanRows = data.map(flattenRow);

  let blob: Blob;
  let filename: string;

  if (format === 'json') {
    const json = JSON.stringify(cleanRows, null, 2);
    blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    filename = `${entity}.json`;
  } else {
    const csv = buildCsv(cleanRows);
    blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    filename = `${entity}.csv`;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

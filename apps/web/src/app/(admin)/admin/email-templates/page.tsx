'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import { Mail, Save, Eye, Code } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface EmailTemplate {
  key: string;
  name: string;
  subject: string;
  body_html: string;
  is_customized: boolean;
}

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState('');
  const [bodyHtml, setBodyHtml] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);

  function selectTemplate(t: EmailTemplate) {
    setSelected(t.key);
    setSubject(t.subject);
    setBodyHtml(t.body_html);
    setShowPreview(false);
  }

  React.useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      try {
        const res = await apiGet<EmailTemplate[]>('/api/admin/email-templates');
        setTemplates(res.data);
        if (res.data.length > 0) {
          selectTemplate(res.data[0]);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    loadTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      await apiPost('/api/admin/email-templates', {
        key: selected,
        subject,
        body_html: bodyHtml,
      });
      setTemplates(templates.map((t) =>
        t.key === selected
          ? { ...t, subject, body_html: bodyHtml, is_customized: true }
          : t
      ));
    } catch { /* ignore */ }
    setSaving(false);
  }

  const selectedTemplate = templates.find((t) => t.key === selected);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Manage and preview email templates for the platform"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">No Templates</p>
            <p className="text-sm text-muted-foreground">Email templates will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Template List */}
          <Card>
            <CardContent className="p-2">
              <div className="space-y-1">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => selectTemplate(t)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      selected === t.key
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.is_customized ? 'Customized' : 'Default'}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          {selectedTemplate ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{selectedTemplate.name}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <><Code className="mr-2 h-4 w-4" />Editor</>
                      ) : (
                        <><Eye className="mr-2 h-4 w-4" />Preview</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {saving ? (
                        <CcdSpinner size="sm" />
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />Save</>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="block w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {showPreview ? (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Preview</label>
                    <div
                      className="rounded-lg border bg-white p-6 min-h-[300px] text-sm text-gray-900"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Body (HTML)</label>
                    <textarea
                      rows={16}
                      value={bodyHtml}
                      onChange={(e) => setBodyHtml(e.target.value)}
                      className="block w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Note: Supabase Auth templates (confirmation, recovery, magic link) are managed via the Supabase dashboard and cannot be edited here.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}

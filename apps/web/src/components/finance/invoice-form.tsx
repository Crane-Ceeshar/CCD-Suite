'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, CardContent, CardHeader, CardTitle, Button, Input, Label, toast,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@ccd/ui';
import { Plus, Trash2, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useCreateInvoice, useUpdateInvoice, useSendInvoice } from '@/hooks/use-finance';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

/* -------------------------------------------------------------------------- */
/*  Payment-terms → due-date helper                                            */
/* -------------------------------------------------------------------------- */

function computeDueDate(issueDate: string, paymentTerms: string): string {
  const base = new Date(issueDate);
  if (isNaN(base.getTime())) return '';
  let days = 30;
  switch (paymentTerms) {
    case 'due_on_receipt': days = 0; break;
    case 'net15': days = 15; break;
    case 'net30': days = 30; break;
    case 'net60': days = 60; break;
    case 'net90': days = 90; break;
  }
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceFormProps {
  invoice?: any;
  onSaved?: () => void;
}

export function InvoiceForm({ invoice, onSaved }: InvoiceFormProps) {
  const router = useRouter();
  const isEditMode = !!invoice;

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceNumberLoading, setInvoiceNumberLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [contactId, setContactId] = useState<string>('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Client selectors
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  // Auto-generate invoice number for new invoices
  const fetchNextInvoiceNumber = () => {
    setInvoiceNumberLoading(true);
    apiGet<{ invoice_number: string }>('/api/finance/invoices/next-number')
      .then((res) => {
        if (res.data?.invoice_number) {
          setInvoiceNumber(res.data.invoice_number);
        }
      })
      .catch(() => {})
      .finally(() => setInvoiceNumberLoading(false));
  };

  // Fetch finance settings to apply as defaults for new invoices
  useEffect(() => {
    if (isEditMode) return; // Don't override existing invoice values

    const today = new Date().toISOString().split('T')[0];

    // Fetch tax, currency, and invoice settings in parallel
    Promise.allSettled([
      apiGet<{ defaultTaxRate?: string }>('/api/settings/module?module=finance&key=tax.preferences'),
      apiGet<{ defaultCurrency?: string }>('/api/settings/module?module=finance&key=currency.preferences'),
      apiGet<{ paymentTerms?: string; defaultNotes?: string }>('/api/settings/module?module=finance&key=invoices.preferences'),
    ]).then(([taxResult, currencyResult, invoiceResult]) => {
      // Apply tax rate from settings
      if (taxResult.status === 'fulfilled' && taxResult.value.data) {
        const taxData = taxResult.value.data as { defaultTaxRate?: string };
        const rate = parseFloat(taxData.defaultTaxRate ?? '0');
        if (!isNaN(rate)) setTaxRate(rate);
      }

      // Apply currency from settings
      if (currencyResult.status === 'fulfilled' && currencyResult.value.data) {
        const currData = currencyResult.value.data as { defaultCurrency?: string };
        if (currData.defaultCurrency) setCurrency(currData.defaultCurrency);
      }

      // Apply payment terms (→ due date) and default notes from settings
      if (invoiceResult.status === 'fulfilled' && invoiceResult.value.data) {
        const invData = invoiceResult.value.data as { paymentTerms?: string; defaultNotes?: string };
        if (invData.paymentTerms) {
          setDueDate(computeDueDate(today, invData.paymentTerms));
        }
        if (invData.defaultNotes) {
          setNotes(invData.defaultNotes);
        }
      }

      setSettingsLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  useEffect(() => {
    // Only auto-generate for new invoices (not edit mode)
    if (!isEditMode) {
      fetchNextInvoiceNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  useEffect(() => {
    apiGet<{ id: string; name: string }[]>('/api/crm/companies?limit=200')
      .then((res) => setCompanies(res.data ?? []))
      .catch(() => {});
    apiGet<{ id: string; first_name: string; last_name: string }[]>('/api/crm/contacts?limit=200')
      .then((res) => setContacts(res.data ?? []))
      .catch(() => {});
  }, []);

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice(invoice?.id ?? '');
  const sendInvoice = useSendInvoice();

  // Pre-populate fields in edit mode
  useEffect(() => {
    if (invoice) {
      setInvoiceNumber(invoice.invoice_number ?? '');
      setCompanyId(invoice.company_id ?? '');
      setContactId(invoice.contact_id ?? '');
      setIssueDate(invoice.issue_date ?? new Date().toISOString().split('T')[0]);
      setDueDate(invoice.due_date ?? '');
      setTaxRate(invoice.tax_rate ?? 0);
      setCurrency(invoice.currency ?? 'USD');
      setNotes(invoice.notes ?? '');
      if (invoice.items && invoice.items.length > 0) {
        setItems(
          invoice.items.map((item: any) => ({
            description: item.description ?? '',
            quantity: item.quantity ?? 1,
            unit_price: item.unit_price ?? 0,
          }))
        );
      }
    }
  }, [invoice]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    const hasValidItem = items.some(
      (item) => item.description.trim() && item.quantity > 0 && item.unit_price > 0
    );
    if (!hasValidItem) {
      newErrors.items = 'At least one line item with a description, quantity, and price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    invoice_number: invoiceNumber,
    company_id: companyId || undefined,
    contact_id: contactId || undefined,
    issue_date: issueDate,
    due_date: dueDate || undefined,
    tax_rate: taxRate,
    currency,
    notes: notes || undefined,
    items: items.filter((item) => item.description.trim()),
  });

  const handleSaveAsDraft = async () => {
    if (!validate()) return;

    try {
      if (isEditMode) {
        await updateInvoice.mutateAsync(buildPayload());
        toast({ title: 'Success', description: 'Invoice updated' });
        onSaved?.();
        router.push(`/finance/invoices/${invoice.id}`);
      } else {
        const result = await createInvoice.mutateAsync(buildPayload());
        const created = result.data as { id: string };
        toast({ title: 'Success', description: 'Invoice created' });
        onSaved?.();
        router.push(`/finance/invoices/${created.id}`);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save invoice', variant: 'destructive' });
    }
  };

  const handleSaveAndSend = async () => {
    if (!validate()) return;

    try {
      let invoiceId: string;

      if (isEditMode) {
        await updateInvoice.mutateAsync(buildPayload());
        invoiceId = invoice.id;
      } else {
        const result = await createInvoice.mutateAsync(buildPayload());
        invoiceId = (result.data as { id: string }).id;
      }

      await sendInvoice.mutateAsync(invoiceId);
      toast({ title: 'Success', description: 'Invoice created and sent' });
      onSaved?.();
      router.push(`/finance/invoices/${invoiceId}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to save and send invoice', variant: 'destructive' });
    }
  };

  const isSaving = createInvoice.isPending || updateInvoice.isPending;
  const isSending = sendInvoice.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Invoice details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <div className="relative">
                  <Input
                    id="invoice-number"
                    placeholder={invoiceNumberLoading ? 'Generating...' : 'C-INV-2026-1'}
                    value={invoiceNumber}
                    onChange={(e) => {
                      setInvoiceNumber(e.target.value);
                      if (errors.invoiceNumber) {
                        setErrors((prev) => ({ ...prev, invoiceNumber: '' }));
                      }
                    }}
                    disabled={invoiceNumberLoading}
                    className={invoiceNumberLoading ? 'pr-10' : !isEditMode ? 'pr-10' : ''}
                  />
                  {invoiceNumberLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!invoiceNumberLoading && !isEditMode && (
                    <button
                      type="button"
                      onClick={fetchNextInvoiceNumber}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Regenerate invoice number"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {errors.invoiceNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.invoiceNumber}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company</Label>
                <Select
                  value={companyId || 'none'}
                  onValueChange={(v) => setCompanyId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No company</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact</Label>
                <Select
                  value={contactId || 'none'}
                  onValueChange={(v) => setContactId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issue-date">Issue Date</Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1" />
              </div>

              {/* Items */}
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}

              {errors.items && (
                <p className="text-sm text-destructive mt-1">{errors.items}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={handleSaveAsDraft}
            disabled={isSaving || isSending}
          >
            {isSaving && !isSending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? 'Update Invoice' : 'Save as Draft'}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSaveAndSend}
            disabled={isSaving || isSending}
          >
            {isSending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save & Send
          </Button>
          <Link href="/finance/invoices" className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

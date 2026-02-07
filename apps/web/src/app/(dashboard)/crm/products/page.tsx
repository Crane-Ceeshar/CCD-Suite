'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  DataTable,
  SearchInput,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Column,
} from '@ccd/ui';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  currency: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface ProductForm {
  name: string;
  description: string;
  sku: string;
  price: string;
  currency: string;
  category: string;
  is_active: string;
}

const initialForm: ProductForm = {
  name: '',
  description: '',
  sku: '',
  price: '0',
  currency: 'USD',
  category: '',
  is_active: 'true',
};

export default function ProductsPage() {
  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<ProductRow | null>(null);
  const [form, setForm] = React.useState<ProductForm>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);

  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await apiGet<ProductRow[]>(`/api/crm/products?${params.toString()}`);
      setProducts(res.data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts, refreshKey]);

  function openNew() {
    setEditProduct(null);
    setForm(initialForm);
    setError('');
    setDialogOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku ?? '',
      price: String(product.price),
      currency: product.currency,
      category: product.category ?? '',
      is_active: String(product.is_active),
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Product name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sku: form.sku.trim() || null,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        category: form.category.trim() || null,
        is_active: form.is_active === 'true',
      };
      if (editProduct) {
        await apiPatch(`/api/crm/products/${editProduct.id}`, payload);
      } else {
        await apiPost('/api/crm/products', payload);
      }
      setDialogOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    try {
      await apiDelete(`/api/crm/products/${id}`);
      setRefreshKey((k) => k + 1);
    } catch { /* ignore */ }
  }

  function update(field: keyof ProductForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const columns: Column<ProductRow>[] = [
    { key: 'name', header: 'Product', sortable: true },
    { key: 'sku', header: 'SKU', render: (p) => p.sku ?? '-' },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (p) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: p.currency,
        }).format(p.price),
    },
    { key: 'category', header: 'Category', render: (p) => p.category ?? '-' },
    {
      key: 'is_active',
      header: 'Status',
      render: (p) => (
        <Badge variant={p.is_active ? 'default' : 'secondary'}>
          {p.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      render: (p) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Services"
        description="Manage your product catalog and service offerings"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Products & Services' },
        ]}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        }
      />
      <div className="space-y-4">
        <SearchInput
          className="max-w-xs"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(p) => p.id}
          emptyMessage="No products found. Add your first product to get started."
          loading={loading}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
            <DialogDescription>
              {editProduct ? 'Update product details' : 'Add a new product or service'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" required>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Product name" />
            </FormField>
            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Product description"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="SKU">
                <Input value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="SKU-001" />
              </FormField>
              <FormField label="Category">
                <Input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="Category" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Price">
                <Input type="number" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} />
              </FormField>
              <FormField label="Currency">
                <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Status">
              <Select value={form.is_active} onValueChange={(v) => update('is_active', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

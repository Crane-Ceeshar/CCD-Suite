'use client';

import * as React from 'react';
import { MODULES } from '@ccd/shared';
import {
  ModuleSettingsDialog,
  type ModuleSettingsTab,
  Button,
  Label,
  Input,
  Switch,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
  CcdLoader,
} from '@ccd/ui';
import {
  Save,
  Landmark,
  DollarSign,
  Percent,
  FileText,
  CreditCard,
} from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface FinanceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Currency Tab ---

interface CurrencySettings {
  defaultCurrency: string;
  autoUpdateExchangeRates: boolean;
  updateFrequency: string;
}

const currencyDefaults: CurrencySettings = {
  defaultCurrency: 'USD',
  autoUpdateExchangeRates: true,
  updateFrequency: 'daily',
};

function CurrencyTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<CurrencySettings>({
      module: 'finance',
      key: 'currency.preferences',
      defaults: currencyDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Currency</Label>
        <p className="text-xs text-muted-foreground">
          The primary currency used for invoices and reports.
        </p>
        <Select
          value={settings.defaultCurrency}
          onValueChange={(v) => updateField('defaultCurrency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - British Pound</SelectItem>
            <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-Update Exchange Rates</Label>
          <p className="text-xs text-muted-foreground">
            Automatically fetch the latest exchange rates.
          </p>
        </div>
        <Switch
          checked={settings.autoUpdateExchangeRates}
          onCheckedChange={(v) => updateField('autoUpdateExchangeRates', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Update Frequency</Label>
        <p className="text-xs text-muted-foreground">
          How often exchange rates are refreshed.
        </p>
        <Select
          value={settings.updateFrequency}
          onValueChange={(v) => updateField('updateFrequency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Tax Tab ---

interface TaxSettings {
  defaultTaxRate: string;
  taxCalculation: string;
  taxIdVatNumber: string;
}

const taxDefaults: TaxSettings = {
  defaultTaxRate: '0',
  taxCalculation: 'exclusive',
  taxIdVatNumber: '',
};

function TaxTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<TaxSettings>({
      module: 'finance',
      key: 'tax.preferences',
      defaults: taxDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Tax Rate (%)</Label>
        <p className="text-xs text-muted-foreground">
          The default tax percentage applied to line items.
        </p>
        <Input
          type="number"
          value={settings.defaultTaxRate}
          onChange={(e) => updateField('defaultTaxRate', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Tax Calculation</Label>
        <p className="text-xs text-muted-foreground">
          Whether tax is included in or added on top of prices.
        </p>
        <Select
          value={settings.taxCalculation}
          onValueChange={(v) => updateField('taxCalculation', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inclusive">Inclusive</SelectItem>
            <SelectItem value="exclusive">Exclusive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Tax ID / VAT Number</Label>
        <p className="text-xs text-muted-foreground">
          Your organization&apos;s tax identification number.
        </p>
        <Input
          value={settings.taxIdVatNumber}
          onChange={(e) => updateField('taxIdVatNumber', e.target.value)}
          placeholder="Enter your tax ID or VAT number"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Invoices Tab ---

interface InvoicesSettings {
  paymentTerms: string;
  invoiceNumberPrefix: string;
  defaultNotes: string;
  includeLogoOnInvoices: boolean;
}

const invoicesDefaults: InvoicesSettings = {
  paymentTerms: 'net30',
  invoiceNumberPrefix: 'INV-',
  defaultNotes: '',
  includeLogoOnInvoices: true,
};

function InvoicesTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<InvoicesSettings>({
      module: 'finance',
      key: 'invoices.preferences',
      defaults: invoicesDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Payment Terms</Label>
        <p className="text-xs text-muted-foreground">
          Default payment terms for new invoices.
        </p>
        <Select
          value={settings.paymentTerms}
          onValueChange={(v) => updateField('paymentTerms', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due_on_receipt">Due on receipt</SelectItem>
            <SelectItem value="net15">Net 15</SelectItem>
            <SelectItem value="net30">Net 30</SelectItem>
            <SelectItem value="net60">Net 60</SelectItem>
            <SelectItem value="net90">Net 90</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Invoice Number Prefix</Label>
        <p className="text-xs text-muted-foreground">
          Prefix added to auto-generated invoice numbers.
        </p>
        <Input
          value={settings.invoiceNumberPrefix}
          onChange={(e) => updateField('invoiceNumberPrefix', e.target.value)}
          placeholder="INV-"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Notes</Label>
        <p className="text-xs text-muted-foreground">
          Notes included at the bottom of every invoice.
        </p>
        <Textarea
          rows={3}
          value={settings.defaultNotes}
          onChange={(e) => updateField('defaultNotes', e.target.value)}
          placeholder="Thank you for your business."
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Include Logo on Invoices</Label>
          <p className="text-xs text-muted-foreground">
            Show your organization logo on generated invoices.
          </p>
        </div>
        <Switch
          checked={settings.includeLogoOnInvoices}
          onCheckedChange={(v) => updateField('includeLogoOnInvoices', v)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Payments Tab ---

interface PaymentsSettings {
  autoSendReceipts: boolean;
  latePaymentReminders: boolean;
  reminderAfterDays: string;
  acceptedMethodsLabel: string;
}

const paymentsDefaults: PaymentsSettings = {
  autoSendReceipts: true,
  latePaymentReminders: true,
  reminderAfterDays: '7',
  acceptedMethodsLabel: 'Bank transfer, Credit card',
};

function PaymentsTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<PaymentsSettings>({
      module: 'finance',
      key: 'payments.preferences',
      defaults: paymentsDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-Send Receipts</Label>
          <p className="text-xs text-muted-foreground">
            Automatically email receipts when payments are received.
          </p>
        </div>
        <Switch
          checked={settings.autoSendReceipts}
          onCheckedChange={(v) => updateField('autoSendReceipts', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Late Payment Reminders</Label>
          <p className="text-xs text-muted-foreground">
            Send automatic reminders for overdue invoices.
          </p>
        </div>
        <Switch
          checked={settings.latePaymentReminders}
          onCheckedChange={(v) => updateField('latePaymentReminders', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Reminder After Days</Label>
        <p className="text-xs text-muted-foreground">
          Number of days after due date to send payment reminders.
        </p>
        <Input
          type="number"
          value={settings.reminderAfterDays}
          onChange={(e) => updateField('reminderAfterDays', e.target.value)}
          placeholder="7"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Accepted Methods Label</Label>
        <p className="text-xs text-muted-foreground">
          Payment methods displayed on invoices.
        </p>
        <Input
          value={settings.acceptedMethodsLabel}
          onChange={(e) => updateField('acceptedMethodsLabel', e.target.value)}
          placeholder="Bank transfer, Credit card"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Main Dialog ---

export function FinanceSettingsDialog({
  open,
  onOpenChange,
}: FinanceSettingsDialogProps) {
  const mod = MODULES['finance'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'currency',
      label: 'Currency',
      icon: <DollarSign />,
      content: <CurrencyTabContent />,
    },
    {
      value: 'tax',
      label: 'Tax',
      icon: <Percent />,
      content: <TaxTabContent />,
    },
    {
      value: 'invoices',
      label: 'Invoices',
      icon: <FileText />,
      content: <InvoicesTabContent />,
    },
    {
      value: 'payments',
      label: 'Payments',
      icon: <CreditCard />,
      content: <PaymentsTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'Finance'} Settings`}
      description="Configure currency, tax, invoicing, and payment preferences."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<Landmark />}
    />
  );
}

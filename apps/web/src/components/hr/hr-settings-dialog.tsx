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
  Users,
  Calendar,
  Building2,
  Banknote,
} from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface HrSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Leave Tab ---

interface LeaveSettings {
  defaultAnnualLeaveDays: string;
  carryOverPolicy: string;
  requireApproval: boolean;
  publicHolidaysRegion: string;
}

const leaveDefaults: LeaveSettings = {
  defaultAnnualLeaveDays: '20',
  carryOverPolicy: 'up_to_5',
  requireApproval: true,
  publicHolidaysRegion: 'us',
};

function LeaveTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<LeaveSettings>({
      module: 'hr',
      key: 'leave.preferences',
      defaults: leaveDefaults,
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
        <Label className="text-sm font-medium">Default Annual Leave Days</Label>
        <p className="text-xs text-muted-foreground">
          Number of paid leave days granted to new employees per year.
        </p>
        <Input
          type="number"
          value={settings.defaultAnnualLeaveDays}
          onChange={(e) => updateField('defaultAnnualLeaveDays', e.target.value)}
          placeholder="20"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Carry-Over Policy</Label>
        <p className="text-xs text-muted-foreground">
          How unused leave days are handled at year end.
        </p>
        <Select
          value={settings.carryOverPolicy}
          onValueChange={(v) => updateField('carryOverPolicy', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No carry-over</SelectItem>
            <SelectItem value="up_to_5">Up to 5 days</SelectItem>
            <SelectItem value="up_to_10">Up to 10 days</SelectItem>
            <SelectItem value="unlimited">Unlimited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Require Approval</Label>
          <p className="text-xs text-muted-foreground">
            Leave requests must be approved by a manager.
          </p>
        </div>
        <Switch
          checked={settings.requireApproval}
          onCheckedChange={(v) => updateField('requireApproval', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Public Holidays Region</Label>
        <p className="text-xs text-muted-foreground">
          The region used to determine public holiday dates.
        </p>
        <Select
          value={settings.publicHolidaysRegion}
          onValueChange={(v) => updateField('publicHolidaysRegion', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="au">Australia</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
            <SelectItem value="fr">France</SelectItem>
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

// --- Departments Tab ---

interface DepartmentsSettings {
  defaultDepartment: string;
  allowCrossDepartmentTransfers: boolean;
  requireDepartmentOnHire: boolean;
}

const departmentsDefaults: DepartmentsSettings = {
  defaultDepartment: 'General',
  allowCrossDepartmentTransfers: true,
  requireDepartmentOnHire: true,
};

function DepartmentsTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<DepartmentsSettings>({
      module: 'hr',
      key: 'departments.preferences',
      defaults: departmentsDefaults,
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
        <Label className="text-sm font-medium">Default Department</Label>
        <p className="text-xs text-muted-foreground">
          The department assigned to new hires when not specified.
        </p>
        <Input
          value={settings.defaultDepartment}
          onChange={(e) => updateField('defaultDepartment', e.target.value)}
          placeholder="General"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Allow Cross-Department Transfers</Label>
          <p className="text-xs text-muted-foreground">
            Allow employees to be transferred between departments.
          </p>
        </div>
        <Switch
          checked={settings.allowCrossDepartmentTransfers}
          onCheckedChange={(v) => updateField('allowCrossDepartmentTransfers', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Require Department on Hire</Label>
          <p className="text-xs text-muted-foreground">
            A department must be assigned when adding a new employee.
          </p>
        </div>
        <Switch
          checked={settings.requireDepartmentOnHire}
          onCheckedChange={(v) => updateField('requireDepartmentOnHire', v)}
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

// --- Payroll Tab ---

interface PayrollSettings {
  payFrequency: string;
  defaultCurrency: string;
  payDay: string;
  enableOvertimeTracking: boolean;
}

const payrollDefaults: PayrollSettings = {
  payFrequency: 'monthly',
  defaultCurrency: 'USD',
  payDay: '1',
  enableOvertimeTracking: false,
};

function PayrollTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<PayrollSettings>({
      module: 'hr',
      key: 'payroll.preferences',
      defaults: payrollDefaults,
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
        <Label className="text-sm font-medium">Pay Frequency</Label>
        <p className="text-xs text-muted-foreground">
          How often employees are paid.
        </p>
        <Select
          value={settings.payFrequency}
          onValueChange={(v) => updateField('payFrequency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="biweekly">Bi-weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Currency</Label>
        <p className="text-xs text-muted-foreground">
          The currency used for payroll calculations.
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

      <div className="space-y-2">
        <Label className="text-sm font-medium">Pay Day</Label>
        <p className="text-xs text-muted-foreground">
          The day of the month when payroll is processed.
        </p>
        <Input
          type="number"
          value={settings.payDay}
          onChange={(e) => updateField('payDay', e.target.value)}
          placeholder="1"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Overtime Tracking</Label>
          <p className="text-xs text-muted-foreground">
            Track and calculate overtime hours for payroll.
          </p>
        </div>
        <Switch
          checked={settings.enableOvertimeTracking}
          onCheckedChange={(v) => updateField('enableOvertimeTracking', v)}
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

export function HrSettingsDialog({
  open,
  onOpenChange,
}: HrSettingsDialogProps) {
  const mod = MODULES['hr'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'leave',
      label: 'Leave',
      icon: <Calendar />,
      content: <LeaveTabContent />,
    },
    {
      value: 'departments',
      label: 'Departments',
      icon: <Building2 />,
      content: <DepartmentsTabContent />,
    },
    {
      value: 'payroll',
      label: 'Payroll',
      icon: <Banknote />,
      content: <PayrollTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'HR'} Settings`}
      description="Configure leave policies, departments, and payroll preferences."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<Users />}
    />
  );
}

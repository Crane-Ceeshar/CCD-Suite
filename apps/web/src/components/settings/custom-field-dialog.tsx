'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Switch,
  Label,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import type { CustomFieldDefinition, CustomFieldType } from '@ccd/shared';
import { apiPost, apiPatch } from '@/lib/api';
import { X, AlertTriangle } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface CustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: string;
  entityType: string;
  field?: CustomFieldDefinition;
  onSuccess: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
];

function generateFieldName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CustomFieldDialog({
  open,
  onOpenChange,
  module,
  entityType,
  field,
  onSuccess,
}: CustomFieldDialogProps) {
  const isEdit = !!field;

  const [label, setLabel] = React.useState('');
  const [name, setName] = React.useState('');
  const [nameManuallyEdited, setNameManuallyEdited] = React.useState(false);
  const [fieldType, setFieldType] = React.useState<CustomFieldType>('text');
  const [isRequired, setIsRequired] = React.useState(false);
  const [options, setOptions] = React.useState<string[]>([]);
  const [newOption, setNewOption] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setLabel(field?.field_label ?? '');
      setName(field?.field_name ?? '');
      setFieldType(field?.field_type ?? 'text');
      setIsRequired(field?.is_required ?? false);
      setOptions((field?.options as string[]) ?? []);
      setNewOption('');
      setNameManuallyEdited(!!field);
    }
  }, [open, field]);

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!nameManuallyEdited) {
      setName(generateFieldName(value));
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    setNameManuallyEdited(true);
  }

  function handleAddOption() {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      toast({
        title: 'Duplicate option',
        description: 'This option already exists.',
        variant: 'destructive',
      });
      return;
    }
    setOptions((prev) => [...prev, trimmed]);
    setNewOption('');
  }

  function handleRemoveOption(option: string) {
    setOptions((prev) => prev.filter((o) => o !== option));
  }

  async function handleSave() {
    if (!label.trim()) {
      toast({
        title: 'Validation error',
        description: 'Label is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Field name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (fieldType === 'select' && options.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Select fields must have at least one option.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await apiPatch(`/api/settings/custom-fields/${field.id}`, {
          field_label: label.trim(),
          field_name: name.trim(),
          field_type: fieldType,
          options: fieldType === 'select' ? options : [],
          is_required: isRequired,
        });
        toast({
          title: 'Field updated',
          description: 'Custom field has been updated successfully.',
        });
      } else {
        await apiPost('/api/settings/custom-fields', {
          module,
          entity_type: entityType,
          field_label: label.trim(),
          field_name: name.trim(),
          field_type: fieldType,
          options: fieldType === 'select' ? options : [],
          is_required: isRequired,
        });
        toast({
          title: 'Field created',
          description: 'Custom field has been created successfully.',
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save custom field.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Custom Field' : 'Add Custom Field'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the custom field configuration.'
              : 'Define a new custom field for this entity.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. Company Size"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. company_size"
              className="font-mono text-sm"
            />
            {nameManuallyEdited && isEdit && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Changing the field name may break existing references.</span>
              </div>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="field-type">Type</Label>
            <Select
              value={fieldType}
              onValueChange={(v) => setFieldType(v as CustomFieldType)}
            >
              <SelectTrigger id="field-type">
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required */}
          <div className="flex items-center gap-3">
            <Switch
              id="field-required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
            <Label htmlFor="field-required">Required</Label>
          </div>

          {/* Options (select type only) */}
          {fieldType === 'select' && (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {options.map((option) => (
                    <Badge
                      key={option}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {option}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(option)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add an option..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            {isEdit ? 'Save Changes' : 'Add Field'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

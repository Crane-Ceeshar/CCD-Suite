'use client';

import * as React from 'react';
import { EnterpriseGate } from '@/components/settings/enterprise-gate';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ConfirmationDialog,
  CcdLoader,
  EmptyState,
  ModuleIcon,
  toast,
} from '@ccd/ui';
import { Columns3, Plus, Pencil, Trash2, Check, Minus } from 'lucide-react';
import { CUSTOM_FIELD_ENTITIES } from '@ccd/shared';
import type { CustomFieldDefinition } from '@ccd/shared';
import { apiGet, apiDelete } from '@/lib/api';
import { CustomFieldDialog } from '@/components/settings/custom-field-dialog';

/* -------------------------------------------------------------------------- */
/*  Entity Fields Sub-component                                                */
/* -------------------------------------------------------------------------- */

function EntityFieldsTable({
  module,
  entityType,
  entityLabel,
}: {
  module: string;
  entityType: string;
  entityLabel: string;
}) {
  const [fields, setFields] = React.useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingField, setEditingField] = React.useState<CustomFieldDefinition | undefined>(
    undefined
  );

  const loadFields = React.useCallback(async () => {
    try {
      const res = await apiGet<CustomFieldDefinition[]>(
        `/api/settings/custom-fields?module=${encodeURIComponent(module)}&entity_type=${encodeURIComponent(entityType)}`
      );
      setFields(res.data ?? []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load custom fields.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [module, entityType]);

  React.useEffect(() => {
    loadFields();
  }, [loadFields]);

  function handleAdd() {
    setEditingField(undefined);
    setDialogOpen(true);
  }

  function handleEdit(field: CustomFieldDefinition) {
    setEditingField(field);
    setDialogOpen(true);
  }

  async function handleDelete(field: CustomFieldDefinition) {
    try {
      await apiDelete(`/api/settings/custom-fields/${field.id}`);
      toast({
        title: 'Field deleted',
        description: `"${field.field_label}" has been removed.`,
      });
      loadFields();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete field.',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <CcdLoader size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Custom fields for {entityLabel}
        </p>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <EmptyState
          icon={<Columns3 className="h-5 w-5 text-muted-foreground" />}
          title="No custom fields"
          description={`Add custom fields to extend ${entityLabel} data.`}
          className="min-h-[200px] border rounded-md"
        />
      ) : (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors bg-muted/30">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Label
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    Required
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {fields.map((field) => (
                  <tr
                    key={field.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle font-medium">
                      {field.field_label}
                    </td>
                    <td className="p-4 align-middle">
                      <code className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {field.field_name}
                      </code>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {field.field_type}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-center">
                      {field.is_required ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(field)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmationDialog
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          }
                          title="Delete Custom Field"
                          description={`Are you sure you want to delete "${field.field_label}"? This may affect existing data.`}
                          confirmLabel="Delete"
                          variant="destructive"
                          onConfirm={() => handleDelete(field)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CustomFieldDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        module={module}
        entityType={entityType}
        field={editingField}
        onSuccess={loadFields}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

const moduleKeys = Object.keys(CUSTOM_FIELD_ENTITIES);

export default function CustomFieldsSettingsPage() {
  const [activeModule, setActiveModule] = React.useState(moduleKeys[0] ?? 'crm');

  const currentModule = CUSTOM_FIELD_ENTITIES[activeModule];
  const entityKeys = currentModule?.entities ?? [];
  const [activeEntity, setActiveEntity] = React.useState(entityKeys[0]?.value ?? '');

  // Reset entity tab when module changes
  React.useEffect(() => {
    const entities = CUSTOM_FIELD_ENTITIES[activeModule]?.entities ?? [];
    if (entities.length > 0) {
      setActiveEntity(entities[0].value);
    }
  }, [activeModule]);

  return (
    <EnterpriseGate feature="Custom fields">
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns3 className="h-5 w-5 text-primary" />
            Custom Fields
          </CardTitle>
          <CardDescription>
            Define custom fields to capture additional data for each module
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Module Tabs */}
          <Tabs value={activeModule} onValueChange={setActiveModule}>
            <TabsList>
              {moduleKeys.map((key) => (
                <TabsTrigger key={key} value={key} className="gap-2">
                  <ModuleIcon moduleId={key} size="sm" />
                  {CUSTOM_FIELD_ENTITIES[key].label}
                </TabsTrigger>
              ))}
            </TabsList>

            {moduleKeys.map((moduleKey) => {
              const mod = CUSTOM_FIELD_ENTITIES[moduleKey];
              return (
                <TabsContent key={moduleKey} value={moduleKey} className="mt-4">
                  {/* Entity Sub-Tabs */}
                  <Tabs
                    value={activeModule === moduleKey ? activeEntity : mod.entities[0]?.value ?? ''}
                    onValueChange={setActiveEntity}
                  >
                    <TabsList>
                      {mod.entities.map((entity) => (
                        <TabsTrigger key={entity.value} value={entity.value}>
                          {entity.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {mod.entities.map((entity) => (
                      <TabsContent
                        key={entity.value}
                        value={entity.value}
                        className="mt-4"
                      >
                        <EntityFieldsTable
                          module={moduleKey}
                          entityType={entity.value}
                          entityLabel={entity.label}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </EnterpriseGate>
  );
}

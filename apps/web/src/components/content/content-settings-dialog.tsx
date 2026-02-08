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
import { Save, FileEdit, Tag, GitBranch, Send } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface ContentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Categories Tab ---

interface CategoriesSettings {
  allowCustomCategories: boolean;
  defaultCategory: string;
  requireCategoryOnPublish: boolean;
}

const categoriesDefaults: CategoriesSettings = {
  allowCustomCategories: true,
  defaultCategory: 'Uncategorized',
  requireCategoryOnPublish: false,
};

function CategoriesTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<CategoriesSettings>({
      module: 'content',
      key: 'categories.preferences',
      defaults: categoriesDefaults,
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
          <Label className="text-sm font-medium">Allow Custom Categories</Label>
          <p className="text-xs text-muted-foreground">
            Let users create new categories when publishing content.
          </p>
        </div>
        <Switch
          checked={settings.allowCustomCategories}
          onCheckedChange={(v) => updateField('allowCustomCategories', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Category</Label>
        <p className="text-xs text-muted-foreground">
          The category assigned to new content by default.
        </p>
        <Input
          value={settings.defaultCategory}
          onChange={(e) => updateField('defaultCategory', e.target.value)}
          placeholder="Uncategorized"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Require Category on Publish</Label>
          <p className="text-xs text-muted-foreground">
            Prevent publishing content without a category assigned.
          </p>
        </div>
        <Switch
          checked={settings.requireCategoryOnPublish}
          onCheckedChange={(v) => updateField('requireCategoryOnPublish', v)}
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

// --- Workflow Tab ---

interface WorkflowSettings {
  requireApproval: boolean;
  autoArchiveAfterDays: string;
  maxRevisions: string;
}

const workflowDefaults: WorkflowSettings = {
  requireApproval: false,
  autoArchiveAfterDays: '90',
  maxRevisions: '10',
};

function WorkflowTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<WorkflowSettings>({
      module: 'content',
      key: 'workflow.preferences',
      defaults: workflowDefaults,
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
          <Label className="text-sm font-medium">Require Approval Before Publishing</Label>
          <p className="text-xs text-muted-foreground">
            Content must be approved by a reviewer before it can be published.
          </p>
        </div>
        <Switch
          checked={settings.requireApproval}
          onCheckedChange={(v) => updateField('requireApproval', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Auto-Archive After Days</Label>
        <p className="text-xs text-muted-foreground">
          Automatically archive content after this many days.
        </p>
        <Input
          type="number"
          value={settings.autoArchiveAfterDays}
          onChange={(e) => updateField('autoArchiveAfterDays', e.target.value)}
          placeholder="90"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Max Revisions to Keep</Label>
        <p className="text-xs text-muted-foreground">
          The maximum number of content revisions stored per item.
        </p>
        <Input
          type="number"
          value={settings.maxRevisions}
          onChange={(e) => updateField('maxRevisions', e.target.value)}
          placeholder="10"
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

// --- Publishing Tab ---

interface PublishingSettings {
  defaultPublishStatus: string;
  enableSeoFields: boolean;
  autoGenerateMetaDescription: boolean;
}

const publishingDefaults: PublishingSettings = {
  defaultPublishStatus: 'draft',
  enableSeoFields: true,
  autoGenerateMetaDescription: true,
};

function PublishingTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<PublishingSettings>({
      module: 'content',
      key: 'publishing.preferences',
      defaults: publishingDefaults,
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
        <Label className="text-sm font-medium">Default Publish Status</Label>
        <p className="text-xs text-muted-foreground">
          The initial status assigned to newly created content.
        </p>
        <Select
          value={settings.defaultPublishStatus}
          onValueChange={(v) => updateField('defaultPublishStatus', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable SEO Fields by Default</Label>
          <p className="text-xs text-muted-foreground">
            Show SEO meta fields when editing content.
          </p>
        </div>
        <Switch
          checked={settings.enableSeoFields}
          onCheckedChange={(v) => updateField('enableSeoFields', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-Generate Meta Description</Label>
          <p className="text-xs text-muted-foreground">
            Automatically create a meta description from content body.
          </p>
        </div>
        <Switch
          checked={settings.autoGenerateMetaDescription}
          onCheckedChange={(v) => updateField('autoGenerateMetaDescription', v)}
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

export function ContentSettingsDialog({
  open,
  onOpenChange,
}: ContentSettingsDialogProps) {
  const mod = MODULES['content'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'categories',
      label: 'Categories',
      icon: <Tag />,
      content: <CategoriesTabContent />,
    },
    {
      value: 'workflow',
      label: 'Workflow',
      icon: <GitBranch />,
      content: <WorkflowTabContent />,
    },
    {
      value: 'publishing',
      label: 'Publishing',
      icon: <Send />,
      content: <PublishingTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'Content'} Settings`}
      description="Configure content categories, workflow, and publishing defaults."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<FileEdit />}
    />
  );
}

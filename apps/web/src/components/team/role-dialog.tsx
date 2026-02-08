'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Checkbox,
  toast,
  CcdSpinner,
} from '@ccd/ui';
import { Shield } from 'lucide-react';
import { MODULES } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';
import { apiPost, apiPatch } from '@/lib/api';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: {
    id: string;
    name: string;
    description: string | null;
    modules: string[];
  } | null;
  onSuccess?: () => void;
}

const AVAILABLE_MODULES = Object.entries(MODULES)
  .filter(([id]) => id !== 'admin')
  .map(([id, mod]) => ({
    id: id as ModuleId,
    name: mod.name,
    color: mod.color,
  }));

export function RoleDialog({ open, onOpenChange, role, onSuccess }: RoleDialogProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedModules, setSelectedModules] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  const isEdit = !!role;

  React.useEffect(() => {
    if (open && role) {
      setName(role.name);
      setDescription(role.description || '');
      setSelectedModules(role.modules);
    } else if (open) {
      setName('');
      setDescription('');
      setSelectedModules([]);
    }
  }, [open, role]);

  function toggleModule(moduleId: string) {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Role name is required.', variant: 'destructive' });
      return;
    }
    if (selectedModules.length === 0) {
      toast({ title: 'Error', description: 'Select at least one module.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && role) {
        await apiPatch(`/api/team/roles/${role.id}`, {
          name: name.trim(),
          description: description.trim() || null,
          modules: selectedModules,
        });
        toast({ title: 'Role updated', description: `${name} has been updated.` });
      } else {
        await apiPost('/api/team/roles', {
          name: name.trim(),
          description: description.trim() || null,
          modules: selectedModules,
        });
        toast({ title: 'Role created', description: `${name} has been created.` });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Failed to save role',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Role' : 'Create Custom Role'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Content Writer"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-desc">Description (optional)</Label>
            <textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role can do..."
              rows={2}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
            />
          </div>

          {/* Module Access */}
          <div className="space-y-3">
            <Label>Module Access</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_MODULES.map((mod) => (
                <label
                  key={mod.id}
                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-all ${
                    selectedModules.includes(mod.id)
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <Checkbox
                    checked={selectedModules.includes(mod.id)}
                    onCheckedChange={() => toggleModule(mod.id)}
                  />
                  <span className="text-xs font-medium">{mod.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

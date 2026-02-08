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
import { Save, Globe, Palette, Shield, Bell } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface PortalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Branding Tab ---

interface BrandingSettings {
  portalLogoUrl: string;
  primaryColor: string;
  welcomeMessage: string;
  customCss: string;
}

const brandingDefaults: BrandingSettings = {
  portalLogoUrl: '',
  primaryColor: '#0ea5e9',
  welcomeMessage: 'Welcome to your client portal.',
  customCss: '',
};

function BrandingTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<BrandingSettings>({
      module: 'client_portal',
      key: 'branding.preferences',
      defaults: brandingDefaults,
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
        <Label className="text-sm font-medium">Portal Logo URL</Label>
        <p className="text-xs text-muted-foreground">
          URL to your logo image displayed in the portal header.
        </p>
        <Input
          value={settings.portalLogoUrl}
          onChange={(e) => updateField('portalLogoUrl', e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Primary Color</Label>
        <p className="text-xs text-muted-foreground">
          The main brand color used throughout the portal.
        </p>
        <Input
          type="color"
          value={settings.primaryColor}
          onChange={(e) => updateField('primaryColor', e.target.value)}
          className="h-10 w-20"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Welcome Message</Label>
        <p className="text-xs text-muted-foreground">
          Message displayed on the portal landing page.
        </p>
        <Textarea
          rows={3}
          value={settings.welcomeMessage}
          onChange={(e) => updateField('welcomeMessage', e.target.value)}
          placeholder="Welcome to your client portal."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Custom CSS</Label>
        <p className="text-xs text-muted-foreground">
          Additional CSS styles applied to the portal.
        </p>
        <Textarea
          rows={4}
          value={settings.customCss}
          onChange={(e) => updateField('customCss', e.target.value)}
          placeholder="/* Custom styles */"
          className="font-mono text-xs"
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

// --- Access Tab ---

interface AccessSettings {
  defaultAccessLevel: string;
  requireLogin: boolean;
  allowFileUploads: boolean;
  maxFileSizeMb: string;
}

const accessDefaults: AccessSettings = {
  defaultAccessLevel: 'view',
  requireLogin: true,
  allowFileUploads: true,
  maxFileSizeMb: '25',
};

function AccessTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<AccessSettings>({
      module: 'client_portal',
      key: 'access.preferences',
      defaults: accessDefaults,
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
        <Label className="text-sm font-medium">Default Access Level</Label>
        <p className="text-xs text-muted-foreground">
          The permission level granted to new portal users.
        </p>
        <Select
          value={settings.defaultAccessLevel}
          onValueChange={(v) => updateField('defaultAccessLevel', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view">View only</SelectItem>
            <SelectItem value="comment">Comment</SelectItem>
            <SelectItem value="edit">Edit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Require Login</Label>
          <p className="text-xs text-muted-foreground">
            Users must authenticate to access the portal.
          </p>
        </div>
        <Switch
          checked={settings.requireLogin}
          onCheckedChange={(v) => updateField('requireLogin', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Allow File Uploads</Label>
          <p className="text-xs text-muted-foreground">
            Let portal users upload files and documents.
          </p>
        </div>
        <Switch
          checked={settings.allowFileUploads}
          onCheckedChange={(v) => updateField('allowFileUploads', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Max File Size (MB)</Label>
        <p className="text-xs text-muted-foreground">
          Maximum file size allowed for uploads.
        </p>
        <Input
          type="number"
          value={settings.maxFileSizeMb}
          onChange={(e) => updateField('maxFileSizeMb', e.target.value)}
          placeholder="25"
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

// --- Notifications Tab ---

interface NotificationsSettings {
  notifyOnNewMessage: boolean;
  notifyOnFileUpload: boolean;
  sendDailyDigest: boolean;
  digestTime: string;
}

const notificationsDefaults: NotificationsSettings = {
  notifyOnNewMessage: true,
  notifyOnFileUpload: true,
  sendDailyDigest: false,
  digestTime: '09:00',
};

function NotificationsTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<NotificationsSettings>({
      module: 'client_portal',
      key: 'notifications.preferences',
      defaults: notificationsDefaults,
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
          <Label className="text-sm font-medium">Notify on New Message</Label>
          <p className="text-xs text-muted-foreground">
            Get notified when a client sends a new message.
          </p>
        </div>
        <Switch
          checked={settings.notifyOnNewMessage}
          onCheckedChange={(v) => updateField('notifyOnNewMessage', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Notify on File Upload</Label>
          <p className="text-xs text-muted-foreground">
            Get notified when a client uploads a file.
          </p>
        </div>
        <Switch
          checked={settings.notifyOnFileUpload}
          onCheckedChange={(v) => updateField('notifyOnFileUpload', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Send Daily Digest</Label>
          <p className="text-xs text-muted-foreground">
            Receive a daily summary of portal activity.
          </p>
        </div>
        <Switch
          checked={settings.sendDailyDigest}
          onCheckedChange={(v) => updateField('sendDailyDigest', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Digest Time</Label>
        <p className="text-xs text-muted-foreground">
          When the daily digest email is sent.
        </p>
        <Input
          type="time"
          value={settings.digestTime}
          onChange={(e) => updateField('digestTime', e.target.value)}
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

export function PortalSettingsDialog({
  open,
  onOpenChange,
}: PortalSettingsDialogProps) {
  const mod = MODULES['client_portal'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'branding',
      label: 'Branding',
      icon: <Palette />,
      content: <BrandingTabContent />,
    },
    {
      value: 'access',
      label: 'Access',
      icon: <Shield />,
      content: <AccessTabContent />,
    },
    {
      value: 'notifications',
      label: 'Notifications',
      icon: <Bell />,
      content: <NotificationsTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'Client Portal'} Settings`}
      description="Configure portal branding, access controls, and notification preferences."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<Globe />}
    />
  );
}

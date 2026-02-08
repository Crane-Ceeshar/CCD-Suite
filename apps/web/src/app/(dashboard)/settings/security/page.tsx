'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Switch,
  Badge,
  EmptyState,
  FormField,
  toast,
  CcdSpinner,
  CcdLoader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@ccd/ui';
import { Shield, Key, Smartphone, Monitor, LogOut } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

/* -------------------------------------------------------------------------- */
/*  SSO Defaults                                                               */
/* -------------------------------------------------------------------------- */

const ssoDefaults = {
  enabled: false,
  provider: '',
  entity_id: '',
  sso_url: '',
  certificate: '',
  default_role: 'client',
};

const ssoProviders = [
  { value: 'google', label: 'Google Workspace' },
  { value: 'microsoft', label: 'Microsoft Entra ID' },
  { value: 'okta', label: 'Okta' },
  { value: 'onelogin', label: 'OneLogin' },
  { value: 'custom', label: 'Custom SAML' },
];

const ssoRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
  { value: 'client', label: 'Client' },
];

/* -------------------------------------------------------------------------- */
/*  Security Settings Page                                                    */
/* -------------------------------------------------------------------------- */

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

  const {
    settings: ssoSettings,
    updateField: updateSsoField,
    loading: ssoLoading,
    saving: ssoSaving,
    save: saveSso,
    isDirty: ssoIsDirty,
  } = useModuleSettings({
    module: 'platform',
    key: 'sso',
    defaults: ssoDefaults,
  });

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Validation error',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
    });
  }

  function handleToggle2FA(checked: boolean) {
    setTwoFactorEnabled(false);
    toast({
      title: 'Coming soon',
      description: 'Two-factor authentication will be available in a future update.',
    });
  }

  if (ssoLoading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Single Sign-On (SSO) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Single Sign-On (SSO)
            <Badge variant="outline">Enterprise</Badge>
          </CardTitle>
          <CardDescription>
            Configure SAML-based single sign-on for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Enable SSO</p>
              <Badge
                variant="secondary"
                className={
                  ssoSettings.enabled
                    ? 'bg-green-500/10 text-green-700 border-green-500/20'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {ssoSettings.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Switch
              checked={ssoSettings.enabled}
              onCheckedChange={(checked) => updateSsoField('enabled', checked)}
            />
          </div>

          {ssoSettings.enabled && (
            <div className="space-y-4 mt-4">
              <FormField label="Identity Provider" htmlFor="sso-provider">
                <Select
                  value={ssoSettings.provider}
                  onValueChange={(v) => updateSsoField('provider', v)}
                >
                  <SelectTrigger id="sso-provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {ssoProviders.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Entity ID" htmlFor="sso-entity-id">
                <Input
                  id="sso-entity-id"
                  value={ssoSettings.entity_id}
                  onChange={(e) => updateSsoField('entity_id', e.target.value)}
                  placeholder="https://your-idp.com/entity-id"
                />
              </FormField>

              <FormField label="SSO URL" htmlFor="sso-url">
                <Input
                  id="sso-url"
                  value={ssoSettings.sso_url}
                  onChange={(e) => updateSsoField('sso_url', e.target.value)}
                  placeholder="https://your-idp.com/sso/saml"
                />
              </FormField>

              <FormField label="X.509 Certificate" htmlFor="sso-certificate">
                <Textarea
                  id="sso-certificate"
                  value={ssoSettings.certificate}
                  onChange={(e) => updateSsoField('certificate', e.target.value)}
                  placeholder="Paste your X.509 certificate here..."
                  className="font-mono text-xs"
                  rows={6}
                />
              </FormField>

              <FormField label="Default Role" htmlFor="sso-default-role">
                <Select
                  value={ssoSettings.default_role}
                  onValueChange={(v) => updateSsoField('default_role', v)}
                >
                  <SelectTrigger id="sso-default-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ssoRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  disabled
                  onClick={() => {
                    toast({
                      title: 'Coming soon',
                      description: 'SSO testing will be available in a future update.',
                    });
                  }}
                >
                  Test Connection
                </Button>
                <Button onClick={saveSso} disabled={ssoSaving || !ssoIsDirty}>
                  {ssoSaving && <CcdSpinner size="sm" className="mr-2" />}
                  Save SSO Settings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-4">
            <FormField label="Current Password" htmlFor="current-password" required>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </FormField>
            <FormField label="New Password" htmlFor="new-password" required>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </FormField>
            <FormField label="Confirm New Password" htmlFor="confirm-password" required>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </FormField>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? (
                <CcdSpinner size="sm" className="mr-2" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Enable two-factor authentication</p>
              <Badge
                variant="secondary"
                className={
                  twoFactorEnabled
                    ? 'bg-green-500/10 text-green-700 border-green-500/20'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-5 w-5 text-primary" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Devices where you are currently signed in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Device
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Browser
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">This device</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      Chrome on macOS
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm text-green-700">Active now</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" disabled>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out All Other Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-5 w-5 text-primary" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for programmatic access
              </CardDescription>
            </div>
            <Button variant="outline" disabled>
              <Key className="mr-2 h-4 w-4" />
              Generate API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Key Prefix
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Last Used
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        icon={<Key className="h-5 w-5 text-muted-foreground" />}
                        title="No API keys"
                        description="Generate an API key to integrate with external services."
                        className="min-h-[200px] border-0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

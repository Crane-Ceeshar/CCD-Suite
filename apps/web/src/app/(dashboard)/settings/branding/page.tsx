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
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
  CcdLoader,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { ImageIcon, Palette, Type, LogIn, Mail, Save } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                   */
/* -------------------------------------------------------------------------- */

const brandingDefaults = {
  logo_url: '',
  primary_color: '#0047AB',
  accent_color: '#8B5CF6',
  sidebar_color: '#1e293b',
  font_family: 'Inter',
  login_welcome_text: '',
  login_bg_color: '#ffffff',
  email_logo_url: '',
  email_footer_text: '',
};

const fontFamilies = [
  { value: 'Inter', label: 'Inter' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
];

/* -------------------------------------------------------------------------- */
/*  Color Picker Row                                                           */
/* -------------------------------------------------------------------------- */

function ColorPickerRow({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-10 rounded cursor-pointer border"
        aria-label={label}
      />
      <div className="flex-1">
        <FormField label={label} htmlFor={id}>
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="font-mono text-sm"
          />
        </FormField>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function BrandingSettingsPage() {
  const { settings, updateField, loading, saving, save, isDirty } =
    useModuleSettings({
      module: 'platform',
      key: 'branding',
      defaults: brandingDefaults,
    });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Logo
          </CardTitle>
          <CardDescription>
            Upload your organization logo for the sidebar and login page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {settings.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={settings.logo_url}
                alt="Organization logo"
                className="max-h-16 object-contain rounded border bg-muted p-2"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <FormField label="Logo URL" htmlFor="logo-url">
            <Input
              id="logo-url"
              value={settings.logo_url}
              onChange={(e) => updateField('logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Customize the color palette used throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorPickerRow
            label="Primary Color"
            id="primary-color"
            value={settings.primary_color}
            onChange={(v) => updateField('primary_color', v)}
          />
          <ColorPickerRow
            label="Accent Color"
            id="accent-color"
            value={settings.accent_color}
            onChange={(v) => updateField('accent_color', v)}
          />
          <ColorPickerRow
            label="Sidebar Color"
            id="sidebar-color"
            value={settings.sidebar_color}
            onChange={(v) => updateField('sidebar_color', v)}
          />
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Typography
          </CardTitle>
          <CardDescription>
            Choose the font family for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField label="Font Family" htmlFor="font-family">
            <Select
              value={settings.font_family}
              onValueChange={(v) => updateField('font_family', v)}
            >
              <SelectTrigger id="font-family">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      {/* Login Page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            Login Page
          </CardTitle>
          <CardDescription>
            Customize the login page appearance for your users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Welcome Message" htmlFor="login-welcome">
            <Textarea
              id="login-welcome"
              value={settings.login_welcome_text}
              onChange={(e) => updateField('login_welcome_text', e.target.value)}
              placeholder="Welcome to our platform..."
              rows={3}
            />
          </FormField>
          <ColorPickerRow
            label="Background Color"
            id="login-bg-color"
            value={settings.login_bg_color}
            onChange={(v) => updateField('login_bg_color', v)}
          />
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Customize the branding used in transactional emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Email Logo URL" htmlFor="email-logo">
            <Input
              id="email-logo"
              value={settings.email_logo_url}
              onChange={(e) => updateField('email_logo_url', e.target.value)}
              placeholder="https://example.com/email-logo.png"
            />
          </FormField>
          <FormField label="Email Footer Text" htmlFor="email-footer">
            <Textarea
              id="email-footer"
              value={settings.email_footer_text}
              onChange={(e) => updateField('email_footer_text', e.target.value)}
              placeholder="Your Company Inc. | 123 Main St..."
              rows={2}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !isDirty}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Branding
        </Button>
      </div>
    </div>
  );
}

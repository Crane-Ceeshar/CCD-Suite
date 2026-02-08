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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
  UserAvatar,
  toast,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import { User, Globe, Save } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

/* -------------------------------------------------------------------------- */
/*  Timezone list (reused from CRM settings)                                  */
/* -------------------------------------------------------------------------- */

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
];

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ProfileData {
  full_name: string;
  email: string;
  avatar_url: string;
  job_title: string;
  phone: string;
  language: string;
  timezone: string;
}

const defaultProfile: ProfileData = {
  full_name: '',
  email: '',
  avatar_url: '',
  job_title: '',
  phone: '',
  language: 'en',
  timezone: 'UTC',
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ProfileSettingsPage() {
  const authUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = React.useState<ProfileData>(defaultProfile);
  const [initialProfile, setInitialProfile] = React.useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<{ value: Partial<ProfileData> }>(
          '/api/settings/module?module=platform&key=profile'
        );

        const saved = res.data?.value ?? {};
        const merged: ProfileData = {
          full_name: saved.full_name || authUser?.full_name || '',
          email: saved.email || authUser?.email || '',
          avatar_url: saved.avatar_url || authUser?.avatar_url || '',
          job_title: saved.job_title || '',
          phone: saved.phone || '',
          language: saved.language || 'en',
          timezone: saved.timezone || 'UTC',
        };

        setProfile(merged);
        setInitialProfile(merged);
      } catch {
        // Fall back to auth user data if settings API fails
        if (authUser) {
          const fallback: ProfileData = {
            full_name: authUser.full_name || '',
            email: authUser.email || '',
            avatar_url: authUser.avatar_url || '',
            job_title: '',
            phone: '',
            language: 'en',
            timezone: 'UTC',
          };
          setProfile(fallback);
          setInitialProfile(fallback);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authUser]);

  function updateField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(initialProfile);

  async function handleSave() {
    if (!profile.full_name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Full name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await apiPatch('/api/settings/module', {
        module: 'platform',
        key: 'profile',
        value: profile,
      });
      setInitialProfile(profile);
      toast({
        title: 'Saved',
        description: 'Profile settings updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Failed to save',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <UserAvatar
              name={profile.full_name || profile.email || 'User'}
              imageUrl={profile.avatar_url || null}
              className="h-20 w-20 text-xl"
            />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="text-lg font-semibold">
                {profile.full_name || 'Your Name'}
              </p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <FormField label="Avatar URL" htmlFor="avatar-url">
                <Input
                  id="avatar-url"
                  value={profile.avatar_url}
                  onChange={(e) => updateField('avatar_url', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>
            Your basic contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name" htmlFor="full-name" required>
              <Input
                id="full-name"
                value={profile.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="John Doe"
              />
            </FormField>
            <FormField label="Email" htmlFor="email" description="Email cannot be changed here">
              <Input
                id="email"
                value={profile.email}
                readOnly
                className="bg-muted/50"
              />
            </FormField>
            <FormField label="Job Title" htmlFor="job-title">
              <Input
                id="job-title"
                value={profile.job_title}
                onChange={(e) => updateField('job_title', e.target.value)}
                placeholder="Product Manager"
              />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Locale */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Locale</CardTitle>
              <CardDescription>
                Language and timezone preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Language" htmlFor="language">
              <Select
                value={profile.language}
                onValueChange={(v) => updateField('language', v)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Timezone" htmlFor="timezone">
              <Select
                value={profile.timezone}
                onValueChange={(v) => updateField('timezone', v)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
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

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
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { VerificationDialog } from '@/components/settings/verification-dialog';

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

  // Email verification state
  const [pendingEmail, setPendingEmail] = React.useState('');
  const [emailVerifyOpen, setEmailVerifyOpen] = React.useState(false);

  // Phone verification state
  const [phoneVerifyOpen, setPhoneVerifyOpen] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        // 1. Fetch profile directly from Supabase for accurate core data
        const supabase = createClient();
        const { data: { user: supaUser } } = await supabase.auth.getUser();
        let dbProfile: { full_name: string; email: string; avatar_url: string | null } | null = null;

        if (supaUser) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', supaUser.id)
            .single();
          dbProfile = data;
        }

        // 2. Fetch extended settings (phone, job_title, language, timezone)
        const res = await apiGet<{ value: Partial<ProfileData> }>(
          '/api/settings/module?module=platform&key=profile'
        );
        const saved = res.data?.value ?? {};

        // 3. Merge: DB profile (most accurate) → saved settings → auth store fallback
        const merged: ProfileData = {
          full_name: dbProfile?.full_name || saved.full_name || authUser?.full_name || '',
          email: dbProfile?.email || saved.email || authUser?.email || '',
          avatar_url: dbProfile?.avatar_url || saved.avatar_url || authUser?.avatar_url || '',
          job_title: saved.job_title || '',
          phone: saved.phone || '',
          language: saved.language || 'en',
          timezone: saved.timezone || 'UTC',
        };

        setProfile(merged);
        setInitialProfile(merged);
      } catch {
        // Fall back to auth user data if everything fails
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

  // For hasChanges, exclude email (handled via verification) from the comparison
  const hasChanges = React.useMemo(() => {
    const { email: _e1, ...rest1 } = profile;
    const { email: _e2, ...rest2 } = initialProfile;
    return JSON.stringify(rest1) !== JSON.stringify(rest2);
  }, [profile, initialProfile]);

  async function handleSave() {
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

  function handleChangeEmail() {
    setPendingEmail(profile.email);
    setEmailVerifyOpen(true);
  }

  function handleEmailVerified() {
    // Update profile with the new verified email
    updateField('email', pendingEmail);
    setInitialProfile((prev) => ({ ...prev, email: pendingEmail }));
  }

  function handleVerifyPhone() {
    setPhoneVerifyOpen(true);
  }

  function handlePhoneVerified() {
    // The phone in profile.phone is already the new value
    setInitialProfile((prev) => ({ ...prev, phone: profile.phone }));
  }

  const phoneChanged = profile.phone !== initialProfile.phone && profile.phone.trim() !== '';

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
            {/* Full Name — read-only */}
            <FormField label="Full Name" htmlFor="full-name" required>
              <Input
                id="full-name"
                value={profile.full_name}
                readOnly
                className="bg-muted/50 cursor-not-allowed"
                placeholder="John Doe"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Name cannot be changed. Contact support to update your name.
              </p>
            </FormField>

            {/* Email — with Change Email button */}
            <FormField label="Email" htmlFor="email">
              <div className="flex gap-2">
                <Input
                  id="email"
                  value={pendingEmail || profile.email}
                  onChange={(e) => setPendingEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 self-start"
                  onClick={handleChangeEmail}
                  disabled={!pendingEmail || pendingEmail === initialProfile.email}
                >
                  Change Email
                </Button>
              </div>
            </FormField>

            {/* Job Title — editable as-is */}
            <FormField label="Job Title" htmlFor="job-title">
              <Input
                id="job-title"
                value={profile.job_title}
                onChange={(e) => updateField('job_title', e.target.value)}
                placeholder="Product Manager"
              />
            </FormField>

            {/* Phone — with Verify button */}
            <FormField label="Phone" htmlFor="phone">
              <div className="flex gap-2">
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="flex-1"
                />
                {phoneChanged && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 self-start"
                    onClick={handleVerifyPhone}
                  >
                    Verify
                  </Button>
                )}
              </div>
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

      {/* Email Verification Dialog */}
      <VerificationDialog
        open={emailVerifyOpen}
        onOpenChange={setEmailVerifyOpen}
        type="email"
        currentValue={initialProfile.email}
        newValue={pendingEmail}
        onVerified={handleEmailVerified}
      />

      {/* Phone Verification Dialog */}
      <VerificationDialog
        open={phoneVerifyOpen}
        onOpenChange={setPhoneVerifyOpen}
        type="phone"
        currentValue={initialProfile.phone}
        newValue={profile.phone}
        onVerified={handlePhoneVerified}
      />
    </div>
  );
}

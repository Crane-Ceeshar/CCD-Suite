'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
  toast,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import { Palette, Sun, Moon, MoonStar, Save } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { apiGet, apiPatch } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface AppearanceSettings {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  sidebarDensity: 'compact' | 'default';
}

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const timeFormats = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

/* -------------------------------------------------------------------------- */
/*  Theme Card Component                                                      */
/* -------------------------------------------------------------------------- */

function ThemeCard({
  label,
  value,
  icon: Icon,
  selected,
  onSelect,
}: {
  label: string;
  value: 'light' | 'dark' | 'night';
  icon: typeof Sun;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-150 hover:bg-muted/50 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card'
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          selected ? 'bg-primary/10' : 'bg-muted'
        }`}
      >
        <Icon
          className={`h-6 w-6 ${
            selected ? 'text-primary' : 'text-muted-foreground'
          }`}
        />
      </div>
      <span
        className={`text-sm font-medium ${
          selected ? 'text-primary' : 'text-foreground'
        }`}
      >
        {label}
      </span>
      {/* Radio indicator */}
      <div
        className={`h-4 w-4 rounded-full border-2 transition-all ${
          selected
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30 bg-transparent'
        }`}
      >
        {selected && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
        )}
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function AppearanceSettingsPage() {
  const {
    theme,
    setTheme,
    dateFormat,
    setDateFormat,
    timeFormat,
    setTimeFormat,
    sidebarDensity,
    setSidebarDensity,
  } = useUIStore();

  const [localDateFormat, setLocalDateFormat] = React.useState(dateFormat);
  const [localTimeFormat, setLocalTimeFormat] = React.useState(timeFormat);
  const [localDensity, setLocalDensity] = React.useState(sidebarDensity);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Load saved preferences from API
  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<{ value: Partial<AppearanceSettings> }>(
          '/api/settings/module?module=platform&key=appearance'
        );
        const saved = res.data?.value;
        if (saved) {
          if (saved.dateFormat) setLocalDateFormat(saved.dateFormat);
          if (saved.timeFormat) setLocalTimeFormat(saved.timeFormat);
          if (saved.sidebarDensity) setLocalDensity(saved.sidebarDensity);
        }
      } catch {
        // Use store defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hasChanges =
    localDateFormat !== dateFormat ||
    localTimeFormat !== timeFormat ||
    localDensity !== sidebarDensity;

  async function handleSave() {
    setSaving(true);
    try {
      await apiPatch('/api/settings/module', {
        module: 'platform',
        key: 'appearance',
        value: {
          dateFormat: localDateFormat,
          timeFormat: localTimeFormat,
          sidebarDensity: localDensity,
        },
      });

      // Update the UI store
      setDateFormat(localDateFormat);
      setTimeFormat(localTimeFormat);
      setSidebarDensity(localDensity);

      toast({
        title: 'Saved',
        description: 'Appearance settings updated successfully.',
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
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the application looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Theme</p>
            <div className="grid grid-cols-3 gap-4">
              <ThemeCard
                label="Light"
                value="light"
                icon={Sun}
                selected={theme === 'light'}
                onSelect={() => setTheme('light')}
              />
              <ThemeCard
                label="Dark"
                value="dark"
                icon={Moon}
                selected={theme === 'dark'}
                onSelect={() => setTheme('dark')}
              />
              <ThemeCard
                label="Night"
                value="night"
                icon={MoonStar}
                selected={theme === 'night'}
                onSelect={() => setTheme('night')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date & Time</CardTitle>
          <CardDescription>
            Configure date and time display formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date Format" htmlFor="date-format">
              <Select
                value={localDateFormat}
                onValueChange={setLocalDateFormat}
              >
                <SelectTrigger id="date-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Time Format" htmlFor="time-format">
              <Select
                value={localTimeFormat}
                onValueChange={(v) => setLocalTimeFormat(v as '12h' | '24h')}
              >
                <SelectTrigger id="time-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {timeFormats.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display</CardTitle>
          <CardDescription>
            Adjust layout density and spacing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField label="Sidebar Density" htmlFor="sidebar-density">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocalDensity('default')}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  localDensity === 'default'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                Default
              </button>
              <button
                type="button"
                onClick={() => setLocalDensity('compact')}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  localDensity === 'compact'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                Compact
              </button>
            </div>
          </FormField>
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

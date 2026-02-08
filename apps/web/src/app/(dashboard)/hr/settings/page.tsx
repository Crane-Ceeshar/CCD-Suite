import { Settings } from 'lucide-react';
import { ModuleIcon } from '@ccd/ui';

export default function HRSettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-2xl border bg-card p-8 max-w-md w-full space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <ModuleIcon moduleId="hr" size="lg" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">HR Settings</h2>
          <p className="text-sm text-muted-foreground">
            Settings for the HR module are coming soon.
            You&apos;ll be able to configure preferences, defaults, and integrations here.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 pt-2">
          <Settings className="h-3.5 w-3.5" />
          <span>Under development</span>
        </div>
      </div>
    </div>
  );
}

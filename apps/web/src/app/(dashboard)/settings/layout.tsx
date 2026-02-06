import { PageHeader } from '@ccd/ui';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and organization settings"
      />
      <div className="flex gap-6">
        <nav className="w-48 space-y-1">
          <a
            href="/settings/profile"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Profile
          </a>
          <a
            href="/settings/organization"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Organization
          </a>
          <a
            href="/settings/team"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Team
          </a>
          <a
            href="/settings/billing"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Billing
          </a>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

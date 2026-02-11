/**
 * Root layout for the client-portal route group.
 * Minimal — just passes children through.
 * This route group is NOT behind the dashboard layout or auth.
 */
export default function ClientPortalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

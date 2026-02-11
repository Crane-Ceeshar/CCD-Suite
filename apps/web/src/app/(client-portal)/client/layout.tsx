'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, FolderOpen } from 'lucide-react';

/**
 * Client dashboard layout.
 * Clean, minimal layout for external clients.
 * Top navbar with logo, navigation, and sign-out.
 */
export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch('/api/portal/session', { method: 'DELETE' });
      router.push('/portal/verify?error=signed_out');
    } catch {
      router.push('/portal/verify');
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/client/dashboard" className="flex items-center gap-2">
              <svg viewBox="0 0 525 448.86" className="h-7 w-7" aria-hidden="true">
                <path fill="#0047AB" d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z"/>
                <polygon fill="#0047AB" points="525 0 219.53 448.86 235.08 253.87 525 0"/>
                <path fill="#0047AB" d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z"/>
              </svg>
              <span className="text-base font-bold text-foreground">Client Portal</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                href="/client/dashboard"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                Projects
              </Link>
            </nav>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-muted-foreground text-center">
            Powered by{' '}
            <a
              href="https://ccdsuite.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              CCD Suite
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle2, LinkIcon } from 'lucide-react';

type VerifyState = 'loading' | 'success' | 'error' | 'no_token';

export default function PortalVerifyPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PortalVerifyContent />
    </React.Suspense>
  );
}

function PortalVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');

  const [state, setState] = React.useState<VerifyState>(token ? 'loading' : 'no_token');
  const [errorMessage, setErrorMessage] = React.useState('');
  const hasVerified = React.useRef(false);

  React.useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    async function verify() {
      try {
        // Step 1: Verify the token
        const verifyRes = await fetch('/api/portal/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.success) {
          setState('error');
          setErrorMessage(verifyData.error?.message || 'Invalid or expired access link');
          return;
        }

        // Step 2: Set the session cookie
        const sessionRes = await fetch('/api/portal/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifyData.data),
        });

        if (!sessionRes.ok) {
          setState('error');
          setErrorMessage('Failed to create session. Please try again.');
          return;
        }

        setState('success');

        // Step 3: Redirect to the client dashboard or specific project
        const { portal_project_id } = verifyData.data;
        if (portal_project_id) {
          router.push(`/client/projects/${portal_project_id}`);
        } else {
          router.push('/client/dashboard');
        }
      } catch {
        setState('error');
        setErrorMessage('Something went wrong. Please try again.');
      }
    }

    verify();
  }, [token, router]);

  // Determine display message for error param
  const getInfoMessage = () => {
    switch (errorParam) {
      case 'session_required':
        return 'Please use your access link to sign in.';
      case 'signed_out':
        return 'You have been signed out successfully.';
      default:
        return null;
    }
  };

  const infoMessage = getInfoMessage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg viewBox="0 0 525 448.86" className="h-8 w-8" aria-hidden="true">
              <path fill="#0047AB" d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z"/>
              <polygon fill="#0047AB" points="525 0 219.53 448.86 235.08 253.87 525 0"/>
              <path fill="#0047AB" d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z"/>
            </svg>
            <span className="text-xl font-bold text-foreground">Client Portal</span>
          </div>
          <p className="text-sm text-muted-foreground">Secure access to your project</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your access link...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm text-muted-foreground">Access verified! Redirecting...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Access Link Invalid</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Please contact the team that shared this link to request a new one.
              </p>
            </div>
          )}

          {state === 'no_token' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <LinkIcon className="h-8 w-8 text-muted-foreground" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Welcome to the Client Portal</p>
                {infoMessage ? (
                  <p className="text-sm text-muted-foreground">{infoMessage}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Use the access link provided by your team to sign in.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Powered by{' '}
          <a href="https://ccdsuite.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            CCD Suite
          </a>
        </p>
      </div>
    </div>
  );
}

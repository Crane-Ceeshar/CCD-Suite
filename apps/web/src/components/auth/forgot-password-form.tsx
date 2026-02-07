'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
  Label,
} from '@ccd/ui';
import { createClient } from '@/lib/supabase/client';
import { OtpInput } from './otp-input';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

type Phase = 'email' | 'otp' | 'password' | 'success';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>('email');
  const [email, setEmail] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Phase 1: Send reset code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setPhase('otp');
    setResendCooldown(60);
  };

  // Phase 2: Verify OTP code
  const handleVerifyOtp = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'recovery',
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // User is now authenticated with a recovery session
    setLoading(false);
    setPhase('password');
  };

  // Resend recovery code
  const handleResendCode = async () => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
      return;
    }

    setResendCooldown(60);
  };

  // Phase 3: Set new password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setPhase('success');
  };

  // Password strength calculation
  const passwordStrength = React.useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  // --- SUCCESS SCREEN ---
  if (phase === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ccd-lime/10 mb-6"
        >
          <CheckCircle2 className="h-8 w-8 text-ccd-lime" />
        </motion.div>
        <h2 className="text-2xl font-bold font-heading text-foreground mb-2">
          Password updated!
        </h2>
        <p className="text-foreground/50 mb-8">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => { router.push('/dashboard'); router.refresh(); }}
            className="w-full h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20"
          >
            Go to Dashboard
          </Button>
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full rounded-xl border-border/50 bg-card hover:bg-muted/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fieldVariants} className="mb-8">
        <h2 className="text-2xl font-bold font-heading text-foreground">
          {phase === 'email' && 'Reset password'}
          {phase === 'otp' && 'Enter verification code'}
          {phase === 'password' && 'Set new password'}
        </h2>
        <p className="mt-2 text-foreground/50">
          {phase === 'email' && "Enter your email and we'll send you a reset code"}
          {phase === 'otp' && (
            <>Code sent to <strong className="text-foreground/70">{email}</strong></>
          )}
          {phase === 'password' && 'Choose a strong new password for your account'}
        </p>
      </motion.div>

      {/* Phase indicator */}
      <motion.div variants={fieldVariants} className="flex items-center gap-2 mb-6">
        {['email', 'otp', 'password'].map((p, i) => (
          <div key={p} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= ['email', 'otp', 'password'].indexOf(phase)
                  ? 'bg-ccd-blue'
                  : 'bg-border/30'
              }`}
            />
          </div>
        ))}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Phase 1: Email Input */}
        {phase === 'email' && (
          <motion.form
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSendCode}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/70">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="pl-10 h-12 bg-card border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending code...
                </div>
              ) : (
                'Send Reset Code'
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-foreground/50 hover:text-ccd-blue transition-colors"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to sign in
              </Link>
            </div>
          </motion.form>
        )}

        {/* Phase 2: OTP Input */}
        {phase === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-ccd-blue/5">
                <ShieldCheck className="h-8 w-8 text-ccd-blue" />
              </div>
            </div>

            <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />

            <Button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length < 6}
              className="w-full h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </Button>

            <p className="text-sm text-foreground/50 text-center">
              Didn&apos;t receive the code?{' '}
              {resendCooldown > 0 ? (
                <span className="text-foreground/40">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-ccd-blue hover:text-ccd-blue/80 font-medium transition-colors"
                >
                  Resend code
                </button>
              )}
            </p>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setPhase('email'); setOtpCode(''); setError(null); }}
                className="inline-flex items-center text-sm text-foreground/50 hover:text-ccd-blue transition-colors"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Use a different email
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 3: New Password */}
        {phase === 'password' && (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleUpdatePassword}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground/70">
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus
                  autoComplete="new-password"
                  className="pl-10 pr-10 h-12 bg-card border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength */}
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength >= level
                        ? level <= 2
                          ? 'bg-orange-400'
                          : 'bg-ccd-lime'
                        : 'bg-border/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-foreground/40">Min. 8 characters with upper, lower case and numbers</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/70">
                Confirm new password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pl-10 h-12 bg-card border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-base font-medium"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating password...
                </div>
              ) : (
                'Set New Password'
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

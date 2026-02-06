'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Label,
} from '@ccd/ui';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/crm');
    router.refresh();
  };

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fieldVariants} className="mb-8">
        <h2 className="text-2xl font-bold font-heading text-ccd-dark">
          Welcome back
        </h2>
        <p className="mt-2 text-foreground/50">
          Sign in to your CCD Suite account
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        {/* Email field */}
        <motion.div variants={fieldVariants} className="space-y-2">
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
              className="pl-10 h-12 bg-white border-border/50 focus:border-ccd-blue focus:ring-ccd-blue/20 rounded-xl transition-all"
            />
          </div>
        </motion.div>

        {/* Password field */}
        <motion.div variants={fieldVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground/70">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-ccd-blue hover:text-ccd-blue/80 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pl-10 pr-10 h-12 bg-white border-border/50 focus:border-ccd-blue focus:ring-ccd-blue/20 rounded-xl transition-all"
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
        </motion.div>

        {/* Submit button */}
        <motion.div variants={fieldVariants}>
          <Button
            type="submit"
            className="w-full h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 group text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fieldVariants} className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-ccd-cream px-4 text-xs text-foreground/30 uppercase tracking-wider">
              or
            </span>
          </div>
        </motion.div>

        {/* Google SSO placeholder */}
        <motion.div variants={fieldVariants}>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-border/50 bg-white hover:bg-muted/50 transition-all text-foreground/70 font-medium"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
        </motion.div>

        {/* Sign up link */}
        <motion.p
          variants={fieldVariants}
          className="text-center text-sm text-foreground/50 pt-2"
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-ccd-blue hover:text-ccd-blue/80 font-medium transition-colors"
          >
            Create account
          </Link>
        </motion.p>
      </form>
    </motion.div>
  );
}

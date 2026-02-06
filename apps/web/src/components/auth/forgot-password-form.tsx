'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Label,
} from '@ccd/ui';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

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

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/profile`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
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
          Check your email
        </h2>
        <p className="text-foreground/50 mb-8">
          We sent a password reset link to <strong className="text-foreground/70">{email}</strong>
        </p>
        <Link href="/login">
          <Button
            variant="outline"
            className="rounded-xl border-border/50 bg-card hover:bg-muted/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fieldVariants} className="mb-8">
        <h2 className="text-2xl font-bold font-heading text-foreground">
          Reset password
        </h2>
        <p className="mt-2 text-foreground/50">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

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
              autoFocus
              className="pl-10 h-12 bg-card border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
            />
          </div>
        </motion.div>

        <motion.div variants={fieldVariants}>
          <Button
            type="submit"
            className="w-full h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </motion.div>

        <motion.div variants={fieldVariants} className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-foreground/50 hover:text-ccd-blue transition-colors"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to sign in
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}

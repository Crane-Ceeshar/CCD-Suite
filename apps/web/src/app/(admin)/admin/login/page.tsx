'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input, Label } from '@ccd/ui';
import { createClient } from '@/lib/supabase/client';
import { isOnAdminSubdomain } from '@/lib/admin-subdomain';
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
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

export default function AdminLoginPage() {
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
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Verify admin access
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      if (!profile || profile.user_type !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. This portal is restricted to administrators.');
        setLoading(false);
        return;
      }
    }

    router.push(isOnAdminSubdomain() ? '/' : '/admin');
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/30">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/3 -left-1/4 w-[600px] h-[600px] rounded-full border border-red-500/[0.06]"
        />
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full border border-red-500/[0.04]"
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Header */}
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fieldVariants} className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 shadow-lg shadow-red-600/30 mb-4">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-white">
                Admin Portal
              </h1>
              <p className="mt-1.5 text-sm text-white/40">
                CCD Suite Administration
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
                  {error}
                </motion.div>
              )}

              {/* Email */}
              <motion.div variants={fieldVariants} className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium text-white/60">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    className="pl-10 h-12 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={fieldVariants} className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium text-white/60">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10 h-12 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fieldVariants}>
                <Button
                  type="submit"
                  className="w-full h-12 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-500/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 group text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/20">
          Restricted access &middot; CCD Suite by{' '}
          <a
            href="https://craneceeshar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-white/50 transition-colors"
          >
            Crane & Ceeshar Digital
          </a>
        </p>
      </motion.div>
    </div>
  );
}

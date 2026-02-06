'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
  Label,
} from '@ccd/ui';
import { createClient } from '@/lib/supabase/client';
import {
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Users,
  BarChart3,
  PenTool,
  FolderKanban,
  Wallet,
  Search,
  Share2,
  LayoutGrid,
} from 'lucide-react';

const TOTAL_STEPS = 4;

const moduleOptions = [
  { id: 'crm', name: 'CRM', icon: Users, color: '#0047AB', description: 'Client relationships & sales' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, color: '#8B5CF6', description: 'Insights & reporting' },
  { id: 'content', name: 'Content', icon: PenTool, color: '#EC4899', description: 'Content creation & scheduling' },
  { id: 'projects', name: 'Projects', icon: FolderKanban, color: '#6366F1', description: 'Tasks & workflows' },
  { id: 'finance', name: 'Finance', icon: Wallet, color: '#14B8A6', description: 'Invoices & expenses' },
  { id: 'seo', name: 'SEO', icon: Search, color: '#9BBD2B', description: 'Search optimisation' },
  { id: 'social', name: 'Social', icon: Share2, color: '#F59E0B', description: 'Social media management' },
  { id: 'portal', name: 'Portal', icon: LayoutGrid, color: '#06B6D4', description: 'Client collaboration' },
  { id: 'hr', name: 'HR', icon: Building2, color: '#F97316', description: 'People management' },
];

const teamSizeOptions = [
  { value: '1-5', label: '1-5 people' },
  { value: '6-15', label: '6-15 people' },
  { value: '16-50', label: '16-50 people' },
  { value: '50+', label: '50+ people' },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
} as const;

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [direction, setDirection] = React.useState(1);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [formData, setFormData] = React.useState({
    orgName: '',
    teamSize: '',
    fullName: '',
    email: '',
    password: '',
    selectedModules: ['crm', 'projects', 'analytics'] as string[],
  });

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleModule = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleId)
        ? prev.selectedModules.filter((m) => m !== moduleId)
        : [...prev.selectedModules, moduleId],
    }));
  };

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.orgName.trim().length >= 2 && formData.teamSize !== '';
      case 2:
        return formData.fullName.trim().length >= 2;
      case 3:
        return formData.email.includes('@') && formData.password.length >= 8;
      case 4:
        return formData.selectedModules.length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const orgSlug = formData.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: formData.orgName,
        slug: orgSlug,
        settings: {
          team_size: formData.teamSize,
          selected_modules: formData.selectedModules,
        },
      })
      .select()
      .single();

    if (tenantError) {
      setError(tenantError.message);
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          tenant_id: tenant.id,
          user_type: 'admin',
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push('/crm');
    router.refresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < TOTAL_STEPS && canProceed()) {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-xs text-foreground/30">
            {step === 1 && 'Organization'}
            {step === 2 && 'Your Details'}
            {step === 3 && 'Account Setup'}
            {step === 4 && 'Choose Modules'}
          </span>
        </div>
        <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-ccd-blue rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-300 ${
                i + 1 < step
                  ? 'bg-ccd-blue text-white'
                  : i + 1 === step
                  ? 'bg-ccd-blue/10 text-ccd-blue border-2 border-ccd-blue'
                  : 'bg-muted/50 text-foreground/30'
              }`}
            >
              {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
          ))}
        </div>
      </div>

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

      {/* Step content */}
      <div className="relative min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Step 1: Organization */}
            {step === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-heading text-ccd-dark">
                    Set up your organization
                  </h2>
                  <p className="mt-1 text-foreground/50 text-sm">
                    Tell us about your agency
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-sm font-medium text-foreground/70">
                    Organization name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                    <Input
                      id="orgName"
                      placeholder="Acme Digital Agency"
                      value={formData.orgName}
                      onChange={(e) => updateField('orgName', e.target.value)}
                      required
                      autoFocus
                      className="pl-10 h-12 bg-white border-border/50 focus:border-ccd-blue focus:ring-ccd-blue/20 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/70">
                    Team size
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {teamSizeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('teamSize', option.value)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          formData.teamSize === option.value
                            ? 'bg-ccd-blue text-white shadow-lg shadow-ccd-blue/20'
                            : 'bg-white border border-border/50 text-foreground/60 hover:border-ccd-blue/30 hover:bg-ccd-blue/5'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Personal details */}
            {step === 2 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-heading text-ccd-dark">
                    About you
                  </h2>
                  <p className="mt-1 text-foreground/50 text-sm">
                    You&apos;ll be the admin for {formData.orgName || 'your organization'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground/70">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      required
                      autoFocus
                      autoComplete="name"
                      className="pl-10 h-12 bg-white border-border/50 focus:border-ccd-blue focus:ring-ccd-blue/20 rounded-xl transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Account credentials */}
            {step === 3 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-heading text-ccd-dark">
                    Create your account
                  </h2>
                  <p className="mt-1 text-foreground/50 text-sm">
                    Set up your login credentials
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/70">
                    Work email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                      className="pl-10 h-12 bg-white border-border/50 focus:border-ccd-blue focus:ring-ccd-blue/20 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/70">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
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
                  {/* Password strength indicator */}
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          formData.password.length >= level * 3
                            ? level <= 2
                              ? 'bg-orange-400'
                              : 'bg-ccd-lime'
                            : 'bg-border/30'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-foreground/40">
                    Min. 8 characters
                  </p>
                </div>
              </>
            )}

            {/* Step 4: Module selection */}
            {step === 4 && (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold font-heading text-ccd-dark">
                    Choose your modules
                  </h2>
                  <p className="mt-1 text-foreground/50 text-sm">
                    Select the modules you want to start with. You can change this later.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {moduleOptions.map((mod) => {
                    const isSelected = formData.selectedModules.includes(mod.id);
                    const IconComp = mod.icon;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-white shadow-lg border-2 scale-[1.02]'
                            : 'bg-white/50 border border-border/30 hover:border-border/50 hover:bg-white/80'
                        }`}
                        style={
                          isSelected ? { borderColor: mod.color } : {}
                        }
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: mod.color }}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${mod.color}15` }}
                        >
                          <IconComp
                            className="h-4 w-4"
                            style={{ color: mod.color }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-foreground/50'}`}>
                          {mod.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-foreground/40 text-center mt-2">
                  {formData.selectedModules.length} module{formData.selectedModules.length !== 1 ? 's' : ''} selected
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3 mt-6">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            className="h-12 px-5 rounded-xl border-border/50 bg-white hover:bg-muted/50 transition-all"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}

        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-1 h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 group text-base font-medium"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="flex-1 h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 group text-base font-medium"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating your workspace...
              </div>
            ) : (
              <>
                Launch CCD Suite
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Sign in link */}
      <p className="text-center text-sm text-foreground/50 mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-ccd-blue hover:text-ccd-blue/80 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

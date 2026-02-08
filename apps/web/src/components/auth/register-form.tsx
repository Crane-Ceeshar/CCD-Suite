'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
  Label,
} from '@ccd/ui';
import { createClient } from '@/lib/supabase/client';
import { OtpInput } from './otp-input';
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
  Loader2,
  Users,
  BarChart3,
  PenTool,
  FolderKanban,
  Wallet,
  Search,
  Share2,
  LayoutGrid,
  Briefcase,
  Sparkles,
  Settings2,
  Crown,
  Zap,
} from 'lucide-react';

const ALL_MODULE_IDS = ['crm', 'analytics', 'content', 'projects', 'finance', 'seo', 'social', 'portal', 'hr'];

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

const planOptions = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    desc: 'Choose any 3 modules',
    icon: Zap,
    color: '#14B8A6',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$59',
    desc: 'All 9 modules included',
    icon: Sparkles,
    color: '#194ca1',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    desc: 'Full suite + advanced features',
    icon: Crown,
    color: '#8B5CF6',
  },
  {
    id: 'custom',
    name: 'Custom',
    price: 'Custom',
    desc: 'Pick any modules you want',
    icon: Settings2,
    color: '#F59E0B',
  },
];

const roleTitleOptions = [
  { value: 'ceo_founder', label: 'CEO / Founder' },
  { value: 'director', label: 'Director' },
  { value: 'head_of_department', label: 'Head of Department' },
  { value: 'manager', label: 'Manager' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'other', label: 'Other' },
];

const teamSizeOptions = [
  { value: '1-5', label: '1-5 people' },
  { value: '6-15', label: '6-15 people' },
  { value: '16-50', label: '16-50 people' },
  { value: '50+', label: '50+ people' },
];

const passwordRequirements = [
  { label: '8+ characters', test: (pw: string) => pw.length >= 8 },
  { label: '1 uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: '1 number', test: (pw: string) => /[0-9]/.test(pw) },
  { label: '1 special character', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
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
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get('plan');

  // If plan is pre-selected from pricing page, skip the plan step
  const hasPlanFromUrl = ['starter', 'professional', 'enterprise', 'custom'].includes(preselectedPlan || '');
  const TOTAL_STEPS = hasPlanFromUrl ? 4 : 5;

  const [step, setStep] = React.useState(1);
  const [direction, setDirection] = React.useState(1);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showOtp, setShowOtp] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [otpLoading, setOtpLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  const [slugStatus, setSlugStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const slugCheckTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = React.useState({
    plan: hasPlanFromUrl ? preselectedPlan! : '',
    orgName: '',
    teamSize: '',
    fullName: '',
    roleTitle: '',
    email: '',
    password: '',
    selectedModules: [] as string[],
  });

  // Auto-select all modules when Professional/Enterprise is chosen
  React.useEffect(() => {
    if (formData.plan === 'professional' || formData.plan === 'enterprise') {
      setFormData((prev) => ({ ...prev, selectedModules: [...ALL_MODULE_IDS] }));
    } else if (formData.plan === 'starter' && formData.selectedModules.length > 3) {
      setFormData((prev) => ({ ...prev, selectedModules: prev.selectedModules.slice(0, 3) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.plan]);

  React.useEffect(() => {
    if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current);

    const orgSlug = formData.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (orgSlug.length < 2) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    slugCheckTimerRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: isAvailable, error } = await supabase.rpc('check_slug_available', { p_slug: orgSlug });
        if (error) {
          setSlugStatus('idle');
          return;
        }
        setSlugStatus(isAvailable ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);

    return () => { if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current); };
  }, [formData.orgName]);

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleModule = (moduleId: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedModules.includes(moduleId);
      if (isSelected) {
        return { ...prev, selectedModules: prev.selectedModules.filter((m) => m !== moduleId) };
      }
      // Enforce max 3 for starter plan
      if (prev.plan === 'starter' && prev.selectedModules.length >= 3) {
        return prev;
      }
      return { ...prev, selectedModules: [...prev.selectedModules, moduleId] };
    });
  };

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  // Map displayed step number to actual content
  // If plan pre-selected: steps 1-4 = org, details, account, modules
  // If no plan pre-selected: steps 1-5 = plan, org, details, account, modules
  const getContentStep = () => {
    if (hasPlanFromUrl) return step; // 1=org, 2=details, 3=account, 4=modules
    return step; // 1=plan, 2=org, 3=details, 4=account, 5=modules
  };

  const contentStep = getContentStep();

  // Determine which content to show based on plan URL state
  const isPlanStep = !hasPlanFromUrl && contentStep === 1;
  const isOrgStep = hasPlanFromUrl ? contentStep === 1 : contentStep === 2;
  const isDetailsStep = hasPlanFromUrl ? contentStep === 2 : contentStep === 3;
  const isAccountStep = hasPlanFromUrl ? contentStep === 3 : contentStep === 4;
  const isModuleStep = hasPlanFromUrl ? contentStep === 4 : contentStep === 5;

  const getStepLabel = () => {
    if (isPlanStep) return 'Choose Plan';
    if (isOrgStep) return 'Organization';
    if (isDetailsStep) return 'Your Details';
    if (isAccountStep) return 'Account Setup';
    if (isModuleStep) return 'Choose Modules';
    return '';
  };

  const canProceed = () => {
    if (isPlanStep) return formData.plan !== '';
    if (isOrgStep) return formData.orgName.trim().length >= 2 && formData.teamSize !== '' && slugStatus !== 'taken';
    if (isDetailsStep) return formData.fullName.trim().length >= 2 && formData.roleTitle !== '';
    if (isAccountStep) return formData.email.includes('@') && passwordRequirements.every((req) => req.test(formData.password));
    if (isModuleStep) return formData.selectedModules.length > 0;
    return false;
  };

  const isAllModulesReadOnly = formData.plan === 'professional' || formData.plan === 'enterprise';

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const orgSlug = formData.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create tenant via secure RPC function (bypasses RLS for unauthenticated registration)
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('register_tenant', {
        p_tenant_name: formData.orgName,
        p_tenant_slug: orgSlug,
        p_settings: {
          team_size: formData.teamSize,
          selected_modules: formData.selectedModules,
        },
        p_plan: formData.plan,
      });

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
          tenant_id: tenantId,
          user_type: 'owner',
          role_title: formData.roleTitle,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Show OTP verification screen instead of redirecting
    setLoading(false);
    setShowOtp(true);
    setResendCooldown(60);
  };

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerifyOtp = async () => {
    setError(null);
    setOtpLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otpCode,
      type: 'signup',
    });

    if (verifyError) {
      setError(verifyError.message);
      setOtpLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleResendOtp = async () => {
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
    });

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResendCooldown(60);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < TOTAL_STEPS && canProceed()) {
      e.preventDefault();
      goNext();
    }
  };

  // OTP verification screen
  if (showOtp) {
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
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ccd-blue/10 mb-6"
        >
          <Mail className="h-8 w-8 text-ccd-blue" />
        </motion.div>

        <h2 className="text-2xl font-bold font-heading text-foreground mb-2">
          Verify your email
        </h2>
        <p className="text-foreground/50 mb-8">
          We sent a 6-digit code to <strong className="text-foreground/70">{formData.email}</strong>
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        <div className="mb-6">
          <OtpInput value={otpCode} onChange={setOtpCode} disabled={otpLoading} />
        </div>

        <Button
          type="button"
          onClick={handleVerifyOtp}
          disabled={otpLoading || otpCode.length < 6}
          className="w-full h-12 bg-ccd-blue hover:bg-ccd-blue/90 text-white rounded-xl shadow-lg shadow-ccd-blue/20 hover:shadow-ccd-blue/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-base font-medium mb-4"
        >
          {otpLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </div>
          ) : (
            'Verify & Continue'
          )}
        </Button>

        <p className="text-sm text-foreground/50">
          Didn&apos;t receive the code?{' '}
          {resendCooldown > 0 ? (
            <span className="text-foreground/40">Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-ccd-blue hover:text-ccd-blue/80 font-medium transition-colors"
            >
              Resend code
            </button>
          )}
        </p>
      </motion.div>
    );
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-xs text-foreground/30">
            {getStepLabel()}
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
            {/* Plan Selection Step */}
            {isPlanStep && (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold font-heading text-foreground">
                    Choose your plan
                  </h2>
                  <p className="mt-1 text-foreground/50 text-sm">
                    All plans include a 14-day free trial. No credit card required.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {planOptions.map((plan) => {
                    const isSelected = formData.plan === plan.id;
                    const IconComp = plan.icon;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => updateField('plan', plan.id)}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-xl transition-all duration-200 text-left ${
                          isSelected
                            ? 'bg-card shadow-lg border-2 scale-[1.01]'
                            : 'bg-card/50 border border-border/30 hover:border-border/50 hover:bg-card/80'
                        }`}
                        style={isSelected ? { borderColor: plan.color } : {}}
                      >
                        {plan.popular && (
                          <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-ccd-blue text-white text-[10px] font-bold">
                            Popular
                          </span>
                        )}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: plan.color }}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: `${plan.color}15` }}
                          >
                            <IconComp className="h-4 w-4" style={{ color: plan.color }} />
                          </div>
                          <div>
                            <span className={`text-sm font-semibold ${isSelected ? 'text-foreground' : 'text-foreground/70'}`}>
                              {plan.name}
                            </span>
                            <span className={`text-xs ml-1.5 ${isSelected ? 'text-foreground/60' : 'text-foreground/40'}`}>
                              {plan.price}/mo
                            </span>
                          </div>
                        </div>
                        <p className={`text-xs ${isSelected ? 'text-foreground/60' : 'text-foreground/40'}`}>
                          {plan.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Organization Step */}
            {isOrgStep && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-heading text-foreground">
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
                      className="pl-10 h-12 bg-card border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                    />
                  </div>
                  {slugStatus === 'checking' && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                    </p>
                  )}
                  {slugStatus === 'available' && (
                    <p className="text-xs text-green-500 flex items-center gap-1.5 mt-1">
                      <Check className="h-3 w-3" /> Name is available
                    </p>
                  )}
                  {slugStatus === 'taken' && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                      This name is already taken. Please try a different name.
                    </p>
                  )}
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
                            : 'bg-card border border-border/50 text-foreground/60 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Personal details Step */}
            {isDetailsStep && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-heading text-foreground">
                    About you
                  </h2>
                  <p className="mt-1 text-foreground/50 text-sm">
                    You&apos;ll be the owner of {formData.orgName || 'your organization'}
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
                      className="pl-10 h-12 bg-card border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/70">
                    Your role
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {roleTitleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('roleTitle', option.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          formData.roleTitle === option.value
                            ? 'bg-ccd-blue text-white shadow-lg shadow-ccd-blue/20'
                            : 'bg-card border border-border/50 text-foreground/60 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Account credentials Step */}
            {isAccountStep && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-heading text-foreground">
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
                      className="pl-10 h-12 bg-card border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
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
                  {/* Password requirements checklist */}
                  {formData.password.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {passwordRequirements.map((req) => {
                        const met = req.test(formData.password);
                        return (
                          <div key={req.label} className="flex items-center gap-2">
                            <div className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                              met ? 'bg-green-500 text-white' : 'border border-border/50'
                            }`}>
                              {met && <Check className="h-2.5 w-2.5" />}
                            </div>
                            <span className={`text-xs transition-colors ${
                              met ? 'text-foreground/70' : 'text-foreground/40'
                            }`}>
                              {req.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Module selection Step */}
            {isModuleStep && (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold font-heading text-foreground">
                    {isAllModulesReadOnly ? 'Your modules' : 'Choose your modules'}
                  </h2>
                  <p className="mt-1 text-foreground/50 text-sm">
                    {formData.plan === 'starter'
                      ? 'Select up to 3 modules for your Starter plan.'
                      : isAllModulesReadOnly
                      ? 'Your plan includes all 9 modules.'
                      : 'Select the modules you want. You can change this later.'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {moduleOptions.map((mod) => {
                    const isSelected = formData.selectedModules.includes(mod.id);
                    const IconComp = mod.icon;
                    const isDisabled = isAllModulesReadOnly ||
                      (formData.plan === 'starter' && !isSelected && formData.selectedModules.length >= 3);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => !isAllModulesReadOnly && toggleModule(mod.id)}
                        disabled={isAllModulesReadOnly}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-card shadow-lg border-2 scale-[1.02]'
                            : isDisabled
                            ? 'bg-muted/30 border border-border/20 opacity-50 cursor-not-allowed'
                            : 'bg-card/50 border border-border/30 hover:border-border/50 hover:bg-card/80'
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
                  {formData.plan === 'starter' && ` (max 3)`}
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
            className="h-12 px-5 rounded-xl border-border/50 bg-card hover:bg-muted/50 transition-all"
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
                Start Free Trial
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

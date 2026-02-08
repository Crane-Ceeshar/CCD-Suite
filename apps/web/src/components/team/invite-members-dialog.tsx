'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  CcdSpinner,
} from '@ccd/ui';
import { Copy, Check, Mail, UserPlus, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface Role {
  slug: string;
  name: string;
  modules: string[];
  is_predefined?: boolean;
}

interface InviteMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  onSuccess?: () => void;
}

export function InviteMembersDialog({
  open,
  onOpenChange,
  tenant,
  onSuccess,
}: InviteMembersDialogProps) {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('sales');
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [memberInfo, setMemberInfo] = React.useState({
    active_count: 0,
    pending_count: 0,
    total_used: 0,
    max_users: 5,
  });

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ccdsuite.com';
  const inviteLink = `https://${tenant.slug}.${baseDomain}`;
  const isAtLimit = memberInfo.total_used >= memberInfo.max_users;

  // Load roles and member info on open
  React.useEffect(() => {
    if (!open) return;

    async function load() {
      try {
        const [rolesRes, membersRes] = await Promise.all([
          apiGet<{ predefined: Role[]; custom: Role[] }>('/api/team/roles'),
          apiGet<{ active_count: number; pending_count: number; total_used: number; max_users: number }>('/api/team/members'),
        ]);

        // Combine predefined (exclude admin, owner, client) + custom roles for invite dropdown
        const predefined = rolesRes.data.predefined.filter(
          (r) => !['admin', 'owner', 'client'].includes(r.slug)
        );
        const custom = rolesRes.data.custom.map((r) => ({
          slug: r.slug,
          name: r.name,
          modules: r.modules,
          is_predefined: false,
        }));
        setRoles([...predefined, ...custom]);

        setMemberInfo({
          active_count: membersRes.data.active_count,
          pending_count: membersRes.data.pending_count,
          total_used: membersRes.data.total_used,
          max_users: membersRes.data.max_users,
        });
      } catch {
        // ignore
      }
    }
    load();
  }, [open]);

  async function handleInvite() {
    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter an email address.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await apiPost('/api/team/invite', {
        email: email.trim().toLowerCase(),
        user_type: role,
        message: message.trim() || undefined,
      });

      toast({
        title: 'Invitation sent!',
        description: `${email} has been invited as ${role}.`,
      });

      setEmail('');
      setMessage('');
      setMemberInfo((prev) => ({
        ...prev,
        pending_count: prev.pending_count + 1,
        total_used: prev.total_used + 1,
      }));

      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Failed to send invitation',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite to {tenant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Invite link section */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">
              Invite with link
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground truncate">
                {inviteLink}
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                {copied ? (
                  <><Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</>
                )}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">Invite with email</span>
            </div>
          </div>

          {/* Member count */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Team members: <span className="font-medium text-foreground">{memberInfo.active_count}</span> active
              {memberInfo.pending_count > 0 && (
                <>, <span className="font-medium text-amber-600">{memberInfo.pending_count}</span> pending</>
              )}
            </span>
            <span className="text-muted-foreground">
              Limit: <span className="font-medium text-foreground">{memberInfo.max_users}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isAtLimit ? 'bg-destructive' : memberInfo.total_used / memberInfo.max_users > 0.8 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((memberInfo.total_used / memberInfo.max_users) * 100, 100)}%` }}
            />
          </div>

          {isAtLimit ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Member limit reached</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upgrade your plan to invite more team members.
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0" asChild>
                <a href="/settings/billing">Upgrade</a>
              </Button>
            </div>
          ) : (
            <>
              {/* Email input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    />
                  </div>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.slug} value={r.slug}>
                          {r.name}
                          {!r.is_predefined && (
                            <span className="ml-1 text-[10px] text-muted-foreground">(custom)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional message */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">
                  Write a message (optional)
                </Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add context for new members"
                  rows={3}
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                />
              </div>

              {/* Send button */}
              <div className="flex justify-end">
                <Button onClick={handleInvite} disabled={sending || !email.trim()}>
                  {sending ? (
                    <CcdSpinner size="sm" className="mr-2" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Invite
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

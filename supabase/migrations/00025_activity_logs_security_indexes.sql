-- Additional indexes for security dashboard login-activity queries
create index if not exists idx_activity_logs_action_created
  on public.activity_logs (action, created_at desc);

-- Index for IP-based lookups (breach detection)
create index if not exists idx_activity_logs_ip
  on public.activity_logs (ip_address)
  where ip_address is not null;

-- ============================================================
-- Fix RLS policies for SEO and Social tables
-- Add explicit WITH CHECK for INSERT operations and GRANT statements
-- ============================================================

-- SEO Tables: Drop old policies and recreate with explicit with check
drop policy if exists "Tenant isolation for seo_projects" on public.seo_projects;
create policy "seo_projects_tenant_select"
  on public.seo_projects for select
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_projects_tenant_insert"
  on public.seo_projects for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "seo_projects_tenant_update"
  on public.seo_projects for update
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_projects_tenant_delete"
  on public.seo_projects for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for seo_audits" on public.seo_audits;
create policy "seo_audits_tenant_select"
  on public.seo_audits for select
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_audits_tenant_insert"
  on public.seo_audits for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "seo_audits_tenant_update"
  on public.seo_audits for update
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_audits_tenant_delete"
  on public.seo_audits for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for seo_keywords" on public.seo_keywords;
create policy "seo_keywords_tenant_select"
  on public.seo_keywords for select
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_keywords_tenant_insert"
  on public.seo_keywords for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "seo_keywords_tenant_update"
  on public.seo_keywords for update
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_keywords_tenant_delete"
  on public.seo_keywords for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for seo_rank_history" on public.seo_rank_history;
create policy "seo_rank_history_tenant_select"
  on public.seo_rank_history for select
  using (
    keyword_id in (
      select id from public.seo_keywords
      where tenant_id = public.get_current_tenant_id()
    )
  );
create policy "seo_rank_history_tenant_insert"
  on public.seo_rank_history for insert
  with check (
    keyword_id in (
      select id from public.seo_keywords
      where tenant_id = public.get_current_tenant_id()
    )
  );
create policy "seo_rank_history_tenant_delete"
  on public.seo_rank_history for delete
  using (
    keyword_id in (
      select id from public.seo_keywords
      where tenant_id = public.get_current_tenant_id()
    )
  );

drop policy if exists "Tenant isolation for seo_backlinks" on public.seo_backlinks;
create policy "seo_backlinks_tenant_select"
  on public.seo_backlinks for select
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_backlinks_tenant_insert"
  on public.seo_backlinks for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "seo_backlinks_tenant_update"
  on public.seo_backlinks for update
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_backlinks_tenant_delete"
  on public.seo_backlinks for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for seo_recommendations" on public.seo_recommendations;
create policy "seo_recommendations_tenant_select"
  on public.seo_recommendations for select
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_recommendations_tenant_insert"
  on public.seo_recommendations for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "seo_recommendations_tenant_update"
  on public.seo_recommendations for update
  using (tenant_id = public.get_current_tenant_id());
create policy "seo_recommendations_tenant_delete"
  on public.seo_recommendations for delete
  using (tenant_id = public.get_current_tenant_id());

-- Social Tables: Drop old policies and recreate with explicit with check
drop policy if exists "Tenant isolation for social_campaigns" on public.social_campaigns;
create policy "social_campaigns_tenant_select"
  on public.social_campaigns for select
  using (tenant_id = public.get_current_tenant_id());
create policy "social_campaigns_tenant_insert"
  on public.social_campaigns for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "social_campaigns_tenant_update"
  on public.social_campaigns for update
  using (tenant_id = public.get_current_tenant_id());
create policy "social_campaigns_tenant_delete"
  on public.social_campaigns for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for social_accounts" on public.social_accounts;
create policy "social_accounts_tenant_select"
  on public.social_accounts for select
  using (tenant_id = public.get_current_tenant_id());
create policy "social_accounts_tenant_insert"
  on public.social_accounts for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "social_accounts_tenant_update"
  on public.social_accounts for update
  using (tenant_id = public.get_current_tenant_id());
create policy "social_accounts_tenant_delete"
  on public.social_accounts for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for social_posts" on public.social_posts;
create policy "social_posts_tenant_select"
  on public.social_posts for select
  using (tenant_id = public.get_current_tenant_id());
create policy "social_posts_tenant_insert"
  on public.social_posts for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "social_posts_tenant_update"
  on public.social_posts for update
  using (tenant_id = public.get_current_tenant_id());
create policy "social_posts_tenant_delete"
  on public.social_posts for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for social_engagement" on public.social_engagement;
create policy "social_engagement_tenant_select"
  on public.social_engagement for select
  using (tenant_id = public.get_current_tenant_id());
create policy "social_engagement_tenant_insert"
  on public.social_engagement for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "social_engagement_tenant_update"
  on public.social_engagement for update
  using (tenant_id = public.get_current_tenant_id());
create policy "social_engagement_tenant_delete"
  on public.social_engagement for delete
  using (tenant_id = public.get_current_tenant_id());

drop policy if exists "Tenant isolation for social_comments" on public.social_comments;
create policy "social_comments_tenant_select"
  on public.social_comments for select
  using (tenant_id = public.get_current_tenant_id());
create policy "social_comments_tenant_insert"
  on public.social_comments for insert
  with check (tenant_id = public.get_current_tenant_id());
create policy "social_comments_tenant_update"
  on public.social_comments for update
  using (tenant_id = public.get_current_tenant_id());
create policy "social_comments_tenant_delete"
  on public.social_comments for delete
  using (tenant_id = public.get_current_tenant_id());

-- Grant table-level permissions to authenticated role
grant select, insert, update, delete on public.seo_projects to authenticated;
grant select, insert, update, delete on public.seo_audits to authenticated;
grant select, insert, update, delete on public.seo_keywords to authenticated;
grant select, insert, delete on public.seo_rank_history to authenticated;
grant select, insert, update, delete on public.seo_backlinks to authenticated;
grant select, insert, update, delete on public.seo_recommendations to authenticated;
grant select, insert, update, delete on public.social_campaigns to authenticated;
grant select, insert, update, delete on public.social_accounts to authenticated;
grant select, insert, update, delete on public.social_posts to authenticated;
grant select, insert, update, delete on public.social_engagement to authenticated;
grant select, insert, update, delete on public.social_comments to authenticated;

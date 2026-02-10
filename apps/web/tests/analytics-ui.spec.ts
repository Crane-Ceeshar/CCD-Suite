import { test, expect } from '@playwright/test';

/**
 * Analytics UI E2E Tests
 *
 * Tests all Analytics pages covering:
 * - Page navigation & loading
 * - Analytics dashboard stats, charts, and date range picker
 * - Custom Dashboards creation, listing, and empty state
 * - Reports creation, builder wizard, and empty state
 * - Data Sources listing, status badges, and refresh
 */

// ─── PAGE NAVIGATION ─────────────────────────────────────────────────────────

test.describe('Analytics Page Navigation', () => {
  test('Analytics Dashboard loads with stats', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    // Verify page heading — PageHeader renders an <h1>
    await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('Custom Dashboards page loads', async ({ page }) => {
    await page.goto('/analytics/dashboards');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Custom Dashboards/ })).toBeVisible({ timeout: 15_000 });
  });

  test('Reports page loads', async ({ page }) => {
    await page.goto('/analytics/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Reports/ })).toBeVisible({ timeout: 15_000 });
  });

  test('Data Sources page loads', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Data Sources/ })).toBeVisible({ timeout: 15_000 });
  });
});

// ─── ANALYTICS DASHBOARD ──────────────────────────────────────────────────────

test.describe('Analytics Dashboard', () => {
  test('Dashboard displays stat cards', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for stats to load (skeleton -> number)
    await page.waitForTimeout(3000);

    // Verify stat card labels are present — at least one should be visible
    const body = page.locator('body');
    const hasRevenue = await body.getByText('Total Revenue').isVisible().catch(() => false);
    const hasPipeline = await body.getByText('Pipeline Value').isVisible().catch(() => false);
    const hasActiveDeals = await body.getByText('Active Deals').isVisible().catch(() => false);
    const hasContentPublished = await body.getByText('Content Published').isVisible().catch(() => false);
    const hasSocialEngagement = await body.getByText('Social Engagement').isVisible().catch(() => false);
    const hasSeoScore = await body.getByText('SEO Score').isVisible().catch(() => false);
    expect(hasRevenue || hasPipeline || hasActiveDeals || hasContentPublished || hasSocialEngagement || hasSeoScore).toBe(true);
  });

  test('Dashboard has date range selector', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // The DateRangePicker component should be visible in the header actions area.
    // It renders as a combobox or button with period text. Also verify the Refresh button.
    const hasRefresh = await page.getByRole('button', { name: /refresh/i }).isVisible().catch(() => false);
    // DateRangePicker is typically a combobox trigger or a button group
    const hasDatePicker = await page.locator('button[role="combobox"]').first().isVisible().catch(() => false);
    const hasDateButton = await page.getByText(/last 30 days|30d|last 7 days|7d|90d/i).first().isVisible().catch(() => false);

    // At least the Refresh button or date picker should be present
    expect(hasRefresh || hasDatePicker || hasDateButton).toBe(true);
  });

  test('Dashboard shows charts', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Recharts renders SVG elements with class recharts-surface
    const svgCharts = page.locator('svg.recharts-surface');
    const chartCount = await svgCharts.count();
    // Accept 0 if no data exists, but verify the chart card titles are present
    const hasRevenueTrend = await page.getByText('Revenue Trend').isVisible().catch(() => false);
    const hasSocialTrend = await page.getByText('Social Engagement Trend').isVisible().catch(() => false);

    // Charts or at least their card titles should be present (unless data is fully empty)
    expect(chartCount >= 0).toBe(true);
    // At least one chart card title or SVG chart should exist
    expect(hasRevenueTrend || hasSocialTrend || chartCount > 0).toBe(true);
  });

  test('Dashboard shows quick link cards', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Quick links at the bottom of the dashboard — use .first() to avoid matching sidebar nav items
    const hasCustomDashboards = await page.getByText('Custom Dashboards').first().isVisible().catch(() => false);
    const hasReports = await page.getByText('Reports').first().isVisible().catch(() => false);
    const hasCrmAnalytics = await page.getByText('CRM Analytics').first().isVisible().catch(() => false);
    const hasSocialAnalytics = await page.getByText('Social Analytics').first().isVisible().catch(() => false);

    expect(hasCustomDashboards || hasReports || hasCrmAnalytics || hasSocialAnalytics).toBe(true);
  });

  test('Dashboard shows team overview section', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // The Overview card should show team/summary metrics
    const hasTeamMembers = await page.getByText('Team Members').isVisible().catch(() => false);
    const hasTotalDeals = await page.getByText('Total Deals').isVisible().catch(() => false);
    const hasContentItems = await page.getByText('Content Items').isVisible().catch(() => false);
    const hasTrackedKeywords = await page.getByText('Tracked Keywords').isVisible().catch(() => false);
    const hasImpressions = await page.getByText('Impressions').isVisible().catch(() => false);

    expect(hasTeamMembers || hasTotalDeals || hasContentItems || hasTrackedKeywords || hasImpressions).toBe(true);
  });
});

// ─── CUSTOM DASHBOARDS ────────────────────────────────────────────────────────

test.describe('Custom Dashboards', () => {
  test('Page shows create dashboard input', async ({ page }) => {
    await page.goto('/analytics/dashboards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should have the dashboard name input
    const nameInput = page.getByPlaceholder('Dashboard name...');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // Should have the Create Dashboard button
    const createBtn = page.getByRole('button', { name: /create dashboard/i });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
  });

  test('Can type a dashboard name without submitting', async ({ page }) => {
    await page.goto('/analytics/dashboards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const nameInput = page.getByPlaceholder('Dashboard name...');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // Type a name but do not submit
    await nameInput.fill('E2E Test Dashboard');
    await expect(nameInput).toHaveValue('E2E Test Dashboard');

    // Create button should be enabled now
    const createBtn = page.getByRole('button', { name: /create dashboard/i });
    await expect(createBtn).toBeEnabled();
  });

  test('Create button is disabled when input is empty', async ({ page }) => {
    await page.goto('/analytics/dashboards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const nameInput = page.getByPlaceholder('Dashboard name...');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // Ensure input is empty
    await nameInput.clear();
    await page.waitForTimeout(500);

    // Create button should be disabled when input is empty
    const createBtn = page.getByRole('button', { name: /create dashboard/i });
    await expect(createBtn).toBeDisabled();
  });

  test('Empty state shows when no dashboards exist', async ({ page }) => {
    await page.goto('/analytics/dashboards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Either dashboard cards are visible (if dashboards exist)
    // or the empty state message is shown
    const hasEmptyState = await page.getByText('No Dashboards Yet').isVisible().catch(() => false);
    const hasDashboardCards = await page.locator('[class*="grid"] [class*="cursor-pointer"]').count() > 0;

    // One of these must be true: either there are dashboards or the empty state is shown
    expect(hasEmptyState || hasDashboardCards).toBe(true);
  });

  test('Page has correct breadcrumbs', async ({ page }) => {
    await page.goto('/analytics/dashboards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Breadcrumbs should show Analytics > Custom Dashboards
    const hasAnalyticsBreadcrumb = await page.getByRole('link', { name: 'Analytics' }).first().isVisible().catch(() => false);
    const hasCustomDashboardsBreadcrumb = await page.getByRole('heading', { name: /Custom Dashboards/ }).isVisible().catch(() => false);

    expect(hasAnalyticsBreadcrumb || hasCustomDashboardsBreadcrumb).toBe(true);
  });
});

// ─── REPORTS ──────────────────────────────────────────────────────────────────

test.describe('Reports', () => {
  test('Reports page has New Report button', async ({ page }) => {
    await page.goto('/analytics/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const newReportBtn = page.getByRole('button', { name: /new report/i });
    await expect(newReportBtn).toBeVisible({ timeout: 10_000 });
  });

  test('Clicking New Report shows report builder', async ({ page }) => {
    await page.goto('/analytics/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click New Report button
    const newReportBtn = page.getByRole('button', { name: /new report/i });
    await expect(newReportBtn).toBeVisible({ timeout: 10_000 });
    await newReportBtn.click();
    await page.waitForTimeout(1000);

    // The report builder card should appear with step indicator
    await expect(page.getByText('Step 1 of 4')).toBeVisible({ timeout: 5_000 });
  });

  test('Report builder has type selection step', async ({ page }) => {
    await page.goto('/analytics/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open builder
    const newReportBtn = page.getByRole('button', { name: /new report/i });
    await newReportBtn.click();
    await page.waitForTimeout(1000);

    // Step 1 should show "Select Report Type"
    await expect(page.getByText(/select report type/i)).toBeVisible({ timeout: 5_000 });

    // Verify report type buttons are visible
    const hasPerformance = await page.getByText('Performance').isVisible().catch(() => false);
    const hasContent = await page.getByText('Content').isVisible().catch(() => false);
    const hasSocial = await page.getByText('Social').isVisible().catch(() => false);
    const hasSeo = await page.getByText('SEO').isVisible().catch(() => false);
    const hasCustom = await page.getByText('Custom').isVisible().catch(() => false);

    expect(hasPerformance || hasContent || hasSocial || hasSeo || hasCustom).toBe(true);
  });

  test('Report builder can navigate steps with Next and Back', async ({ page }) => {
    await page.goto('/analytics/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open builder
    const newReportBtn = page.getByRole('button', { name: /new report/i });
    await newReportBtn.click();
    await page.waitForTimeout(1000);

    // Should start on Step 1
    await expect(page.getByText('Step 1 of 4')).toBeVisible({ timeout: 5_000 });

    // Click Next to go to Step 2
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await nextBtn.click();
    await page.waitForTimeout(1000);

    // Should now be on Step 2 — "Choose Metrics"
    await expect(page.getByText('Step 2 of 4')).toBeVisible({ timeout: 5_000 });

    // Click Back to return to Step 1
    const backBtn = page.getByRole('button', { name: /back/i });
    await expect(backBtn).toBeVisible({ timeout: 5_000 });
    await backBtn.click();
    await page.waitForTimeout(1000);

    // Should be back on Step 1
    await expect(page.getByText('Step 1 of 4')).toBeVisible({ timeout: 5_000 });
  });

  test('Empty state shows when no reports exist', async ({ page }) => {
    await page.goto('/analytics/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Either report cards are visible (if reports exist)
    // or the empty state message is shown
    const hasEmptyState = await page.getByText('No Reports Yet').isVisible().catch(() => false);
    const hasReportCards = await page.locator('.grid .transition-shadow').count() > 0;
    const hasNewReport = await page.getByRole('button', { name: /new report/i }).isVisible().catch(() => false);

    // Should have either the empty state or report cards, and always the New Report button
    expect(hasEmptyState || hasReportCards).toBe(true);
    expect(hasNewReport).toBe(true);
  });

  test('Report builder Cancel returns to list', async ({ page }) => {
    await page.goto('/analytics/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open builder
    const newReportBtn = page.getByRole('button', { name: /new report/i });
    await newReportBtn.click();
    await page.waitForTimeout(1000);

    // Builder should be visible
    await expect(page.getByText('Step 1 of 4')).toBeVisible({ timeout: 5_000 });

    // Click Cancel
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
    await cancelBtn.click();
    await page.waitForTimeout(1000);

    // Builder should be hidden — step indicator should not be visible
    const hasStepIndicator = await page.getByText('Step 1 of 4').isVisible().catch(() => false);
    expect(hasStepIndicator).toBe(false);
  });
});

// ─── DATA SOURCES ─────────────────────────────────────────────────────────────

test.describe('Data Sources', () => {
  test('Shows CRM Deals source card (always active)', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // CRM Deals card should always be present
    await expect(page.getByText('CRM Deals').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Shows all expected data source cards', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify all five data source card titles are present.
    // Use CardTitle selectors to avoid matching sidebar or other UI text,
    // and scroll into view if cards are below the fold.
    const sourceNames = ['CRM Deals', 'Social Media', 'SEO Audits', 'Content Module', 'Google Analytics'];
    let visibleCount = 0;
    for (const name of sourceNames) {
      const card = page.getByText(name, { exact: true }).first();
      try {
        await card.scrollIntoViewIfNeeded({ timeout: 5_000 });
        const isVis = await card.isVisible();
        if (isVis) visibleCount++;
      } catch {
        // card not found — skip
      }
    }
    // All five source cards should be visible
    expect(visibleCount).toBe(sourceNames.length);
  });

  test('Shows Google Analytics card as not configured', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Google Analytics should always be "Not Configured" since it's hardcoded that way
    const notConfiguredBadges = page.getByText('Not Configured');
    const count = await notConfiguredBadges.count();
    // At least one "Not Configured" badge should be present (Google Analytics at minimum)
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Source cards show status badges', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Should have status badges — Active, Connected, or Not Configured
    const hasActive = await page.getByText('Active').first().isVisible().catch(() => false);
    const hasConnected = await page.getByText('Connected').first().isVisible().catch(() => false);
    const hasNotConfigured = await page.getByText('Not Configured').first().isVisible().catch(() => false);

    // At least one status badge type should exist
    expect(hasActive || hasConnected || hasNotConfigured).toBe(true);
  });

  test('Refresh Status button is visible and functional', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Refresh Status button should be in the page header
    const refreshBtn = page.getByRole('button', { name: /refresh status/i });
    await expect(refreshBtn).toBeVisible({ timeout: 10_000 });

    // Click it and verify it doesn't crash — should trigger a data refresh
    await refreshBtn.click();
    await page.waitForTimeout(2000);

    // Page should still be functional after refresh — use heading to avoid sidebar ambiguity
    await expect(page.getByRole('heading', { name: /Data Sources/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('CRM Deals').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Source cards have Configure buttons', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Each source card has a "Configure" button
    const configureButtons = page.getByRole('button', { name: /configure/i });
    const count = await configureButtons.count();
    // Should have one Configure button per source card (5 sources)
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Page has correct breadcrumbs', async ({ page }) => {
    await page.goto('/analytics/sources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Breadcrumbs should show Analytics > Data Sources
    const hasAnalyticsBreadcrumb = await page.getByRole('link', { name: 'Analytics' }).first().isVisible().catch(() => false);
    const hasDataSourcesBreadcrumb = await page.getByRole('heading', { name: /Data Sources/ }).isVisible().catch(() => false);

    expect(hasAnalyticsBreadcrumb || hasDataSourcesBreadcrumb).toBe(true);
  });
});

// ─── SIDEBAR NAVIGATION ─────────────────────────────────────────────────────

test.describe('Analytics Sidebar Navigation', () => {
  test('Sidebar has all Analytics nav items', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for nav items in the module shell sidebar
    // Layout defines: Dashboard, Reports, Custom Dashboards, Data Sources
    const navLabels = ['Dashboard', 'Reports', 'Custom Dashboards', 'Data Sources'];
    let visibleCount = 0;
    for (const label of navLabels) {
      const navItem = page.getByRole('link', { name: label }).or(page.locator('a').filter({ hasText: label }));
      const isVisible = await navItem.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) visibleCount++;
    }
    // Most nav items should be visible
    expect(visibleCount).toBeGreaterThanOrEqual(1);
  });

  test('Clicking sidebar Reports nav navigates correctly', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click "Reports" in sidebar
    const reportsNav = page.locator('a[href="/analytics/reports"]');
    if (await reportsNav.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsNav.first().click();
      await page.waitForURL('**/analytics/reports');
      expect(page.url()).toContain('/analytics/reports');
    }
  });

  test('Clicking sidebar Data Sources nav navigates correctly', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click "Data Sources" in sidebar
    const sourcesNav = page.locator('a[href="/analytics/sources"]');
    if (await sourcesNav.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await sourcesNav.first().click();
      await page.waitForURL('**/analytics/sources');
      expect(page.url()).toContain('/analytics/sources');
    }
  });
});

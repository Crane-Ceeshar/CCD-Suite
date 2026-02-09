import * as cheerio from 'cheerio';
import type {
  AuditResults,
  AuditIssue,
  AuditMetaTags,
  AuditContentStructure,
  AuditTechnical,
  CoreWebVitals,
  WebVitalRating,
  RecommendationType,
  RecommendationPriority,
} from '@ccd/shared/types/seo';

// ── Google PageSpeed Insights ──────────────────────────────────────

const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface PsiResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number };
      seo?: { score: number };
      'best-practices'?: { score: number };
      accessibility?: { score: number };
    };
    audits?: Record<string, { score?: number | null; numericValue?: number; displayValue?: string }>;
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
}

async function fetchPsiData(url: string): Promise<PsiResponse | null> {
  try {
    const params = new URLSearchParams({
      url,
      strategy: 'mobile',
      category: 'PERFORMANCE',
    });
    // PSI only allows one category per param key, so append the rest
    params.append('category', 'SEO');
    params.append('category', 'BEST_PRACTICES');
    params.append('category', 'ACCESSIBILITY');

    const res = await fetch(`${PSI_API}?${params.toString()}`, {
      signal: AbortSignal.timeout(60_000), // 60s timeout
    });

    if (!res.ok) {
      console.error(`[SEO Audit] PSI API returned ${res.status} for ${url}`);
      return null;
    }
    return (await res.json()) as PsiResponse;
  } catch (err) {
    console.error(`[SEO Audit] PSI API failed for ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

interface LighthouseScores {
  performance: number | null;
  seo: number | null;
  bestPractices: number | null;
  accessibility: number | null;
}

function extractLighthouseScores(psi: PsiResponse | null): LighthouseScores {
  const cats = psi?.lighthouseResult?.categories;
  if (!cats) {
    // PSI data unavailable — return nulls so UI can show "N/A"
    return { performance: null, seo: null, bestPractices: null, accessibility: null };
  }
  return {
    performance: cats.performance?.score != null ? Math.round(cats.performance.score * 100) : null,
    seo: cats.seo?.score != null ? Math.round(cats.seo.score * 100) : null,
    bestPractices: cats['best-practices']?.score != null ? Math.round(cats['best-practices'].score * 100) : null,
    accessibility: cats.accessibility?.score != null ? Math.round(cats.accessibility.score * 100) : null,
  };
}

function rateMetric(value: number, good: number, poor: number, lowerIsBetter = true): WebVitalRating {
  if (lowerIsBetter) {
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }
  if (value >= good) return 'good';
  if (value >= poor) return 'needs-improvement';
  return 'poor';
}

function extractCoreWebVitals(psi: PsiResponse | null): CoreWebVitals {
  const metrics = psi?.loadingExperience?.metrics;
  const audits = psi?.lighthouseResult?.audits;

  const lcp = metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile
    ?? audits?.['largest-contentful-paint']?.numericValue
    ?? 0;
  const fid = metrics?.FIRST_INPUT_DELAY_MS?.percentile
    ?? audits?.['max-potential-fid']?.numericValue
    ?? 0;
  const cls = (metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? 0) / 100
    || audits?.['cumulative-layout-shift']?.numericValue
    || 0;

  return {
    lcp: Math.round(lcp),
    fid: Math.round(fid),
    cls: Math.round(cls * 1000) / 1000,
    lcpRating: rateMetric(lcp, 2500, 4000),
    fidRating: rateMetric(fid, 100, 300),
    clsRating: rateMetric(cls, 0.1, 0.25),
  };
}

// ── HTML Crawl ─────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CCD-SEO-Auditor/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function analyzeMetaTags($: cheerio.CheerioAPI, domain: string): AuditMetaTags {
  const titleEl = $('title').first().text().trim();
  const descEl = $('meta[name="description"]').attr('content')?.trim() ?? null;

  return {
    title: {
      exists: titleEl.length > 0,
      value: titleEl || null,
      length: titleEl.length,
      optimal: titleEl.length >= 30 && titleEl.length <= 60,
    },
    description: {
      exists: descEl !== null && descEl.length > 0,
      value: descEl,
      length: descEl?.length ?? 0,
      optimal: (descEl?.length ?? 0) >= 120 && (descEl?.length ?? 0) <= 160,
    },
    ogTitle: $('meta[property="og:title"]').length > 0,
    ogDescription: $('meta[property="og:description"]').length > 0,
    ogImage: $('meta[property="og:image"]').length > 0,
    canonical: $('link[rel="canonical"]').length > 0,
    robots: $('meta[name="robots"]').attr('content') ?? null,
    viewport: $('meta[name="viewport"]').length > 0,
  };
}

function analyzeContentStructure($: cheerio.CheerioAPI, domain: string): AuditContentStructure {
  const h1Count = $('h1').length;

  // Check heading hierarchy (no skipped levels)
  const headingLevels: number[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = ('tagName' in el ? (el.tagName ?? '') : '').toLowerCase();
    const level = parseInt(tag.replace('h', ''), 10);
    if (!isNaN(level)) headingLevels.push(level);
  });

  let hierarchyValid = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      hierarchyValid = false;
      break;
    }
  }

  const images = $('img');
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt.trim() === '') imagesMissingAlt++;
  });

  let internalLinks = 0;
  let externalLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.startsWith('/') || href.startsWith('#') || href.includes(domain)) {
      internalLinks++;
    } else if (href.startsWith('http')) {
      externalLinks++;
    }
  });

  return {
    h1Count,
    headingHierarchyValid: hierarchyValid,
    totalImages: images.length,
    imagesMissingAlt,
    internalLinks,
    externalLinks,
  };
}

async function checkResourceExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function analyzeTechnical(domain: string): Promise<AuditTechnical> {
  const baseUrl = `https://${domain}`;
  const [robotsTxt, sitemap] = await Promise.all([
    checkResourceExists(`${baseUrl}/robots.txt`),
    checkResourceExists(`${baseUrl}/sitemap.xml`),
  ]);

  return {
    https: true, // We're checking via https
    robotsTxt,
    sitemap,
  };
}

// ── Issue Generation ───────────────────────────────────────────────

function generateIssues(
  lighthouse: LighthouseScores,
  metaTags: AuditMetaTags,
  content: AuditContentStructure,
  technical: AuditTechnical,
  cwv: CoreWebVitals,
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Lighthouse-based issues (only when PSI data is available)
  if (lighthouse.performance != null && lighthouse.performance < 50) {
    issues.push({
      type: 'performance',
      priority: 'critical',
      title: 'Very poor performance score',
      description: `Page performance score is ${lighthouse.performance}/100. Optimize images, reduce JavaScript, and leverage browser caching.`,
    });
  } else if (lighthouse.performance != null && lighthouse.performance < 75) {
    issues.push({
      type: 'performance',
      priority: 'high',
      title: 'Performance needs improvement',
      description: `Page performance score is ${lighthouse.performance}/100. Consider optimizing render-blocking resources and image sizes.`,
    });
  }

  if (lighthouse.seo != null && lighthouse.seo < 80) {
    issues.push({
      type: 'on_page',
      priority: lighthouse.seo < 50 ? 'critical' : 'high',
      title: 'Lighthouse SEO score below threshold',
      description: `Lighthouse SEO score is ${lighthouse.seo}/100. Review meta tags, structured data, and crawlability.`,
    });
  }

  if (lighthouse.accessibility != null && lighthouse.accessibility < 70) {
    issues.push({
      type: 'technical',
      priority: 'medium',
      title: 'Accessibility issues detected',
      description: `Accessibility score is ${lighthouse.accessibility}/100. Improve ARIA labels, colour contrast, and keyboard navigation.`,
    });
  }

  // Core Web Vitals issues
  if (cwv.lcpRating === 'poor') {
    issues.push({
      type: 'performance',
      priority: 'critical',
      title: 'Largest Contentful Paint (LCP) is poor',
      description: `LCP is ${(cwv.lcp / 1000).toFixed(1)}s (should be under 2.5s). Optimize the largest visible element loading time.`,
    });
  } else if (cwv.lcpRating === 'needs-improvement') {
    issues.push({
      type: 'performance',
      priority: 'high',
      title: 'Largest Contentful Paint (LCP) needs improvement',
      description: `LCP is ${(cwv.lcp / 1000).toFixed(1)}s. Target under 2.5s for a good user experience.`,
    });
  }

  if (cwv.clsRating === 'poor') {
    issues.push({
      type: 'performance',
      priority: 'high',
      title: 'Cumulative Layout Shift (CLS) is poor',
      description: `CLS is ${cwv.cls}. Add explicit dimensions to images and ads to prevent layout shifts.`,
    });
  }

  // Meta tag issues
  if (!metaTags.title.exists) {
    issues.push({ type: 'on_page', priority: 'critical', title: 'Missing page title', description: 'The page has no <title> tag. Add a unique, descriptive title (30-60 characters).' });
  } else if (!metaTags.title.optimal) {
    issues.push({ type: 'on_page', priority: 'medium', title: 'Page title length not optimal', description: `Title is ${metaTags.title.length} characters. Optimal length is 30-60 characters.` });
  }

  if (!metaTags.description.exists) {
    issues.push({ type: 'on_page', priority: 'critical', title: 'Missing meta description', description: 'The page has no meta description. Add a compelling description (120-160 characters) to improve CTR.' });
  } else if (!metaTags.description.optimal) {
    issues.push({ type: 'on_page', priority: 'medium', title: 'Meta description length not optimal', description: `Description is ${metaTags.description.length} characters. Optimal length is 120-160 characters.` });
  }

  if (!metaTags.ogTitle || !metaTags.ogDescription || !metaTags.ogImage) {
    const missing = [!metaTags.ogTitle && 'og:title', !metaTags.ogDescription && 'og:description', !metaTags.ogImage && 'og:image'].filter(Boolean);
    issues.push({ type: 'on_page', priority: 'medium', title: 'Missing Open Graph tags', description: `Missing: ${missing.join(', ')}. Add OG tags for better social media sharing.` });
  }

  if (!metaTags.canonical) {
    issues.push({ type: 'technical', priority: 'high', title: 'Missing canonical URL', description: 'Add a <link rel="canonical"> tag to prevent duplicate content issues.' });
  }

  if (!metaTags.viewport) {
    issues.push({ type: 'technical', priority: 'critical', title: 'Missing viewport meta tag', description: 'Add <meta name="viewport"> for proper mobile rendering.' });
  }

  // Content structure issues
  if (content.h1Count === 0) {
    issues.push({ type: 'content', priority: 'high', title: 'Missing H1 heading', description: 'The page has no H1 tag. Add a single, descriptive H1 heading.' });
  } else if (content.h1Count > 1) {
    issues.push({ type: 'content', priority: 'medium', title: 'Multiple H1 headings', description: `Found ${content.h1Count} H1 tags. Best practice is to have exactly one H1 per page.` });
  }

  if (!content.headingHierarchyValid) {
    issues.push({ type: 'content', priority: 'low', title: 'Heading hierarchy has gaps', description: 'Heading levels skip (e.g. H2 to H4). Maintain proper H1 > H2 > H3 hierarchy.' });
  }

  if (content.totalImages > 0 && content.imagesMissingAlt > 0) {
    const pct = Math.round((content.imagesMissingAlt / content.totalImages) * 100);
    issues.push({
      type: 'content',
      priority: pct > 50 ? 'high' : 'medium',
      title: 'Images missing alt text',
      description: `${content.imagesMissingAlt} of ${content.totalImages} images (${pct}%) lack alt attributes. Add descriptive alt text for accessibility and SEO.`,
    });
  }

  // Technical issues
  if (!technical.robotsTxt) {
    issues.push({ type: 'technical', priority: 'medium', title: 'Missing robots.txt', description: 'No robots.txt file found. Create one to control how search engines crawl your site.' });
  }

  if (!technical.sitemap) {
    issues.push({ type: 'technical', priority: 'medium', title: 'Missing XML sitemap', description: 'No sitemap.xml found. Create an XML sitemap to help search engines discover your pages.' });
  }

  return issues;
}

// ── Scoring ────────────────────────────────────────────────────────

function computeMetaTagsScore(meta: AuditMetaTags): number {
  let score = 0;
  const total = 8;
  if (meta.title.exists) score++;
  if (meta.title.optimal) score++;
  if (meta.description.exists) score++;
  if (meta.description.optimal) score++;
  if (meta.ogTitle && meta.ogDescription && meta.ogImage) score++;
  if (meta.canonical) score++;
  if (meta.viewport) score++;
  if (meta.robots === null || !meta.robots.includes('noindex')) score++;
  return Math.round((score / total) * 100);
}

function computeContentScore(content: AuditContentStructure): number {
  let score = 0;
  const total = 4;
  if (content.h1Count === 1) score++;
  if (content.headingHierarchyValid) score++;
  if (content.totalImages === 0 || content.imagesMissingAlt === 0) score++;
  if (content.internalLinks > 0) score++;
  return Math.round((score / total) * 100);
}

function computeTechnicalScore(tech: AuditTechnical): number {
  let score = 0;
  const total = 3;
  if (tech.https) score++;
  if (tech.robotsTxt) score++;
  if (tech.sitemap) score++;
  return Math.round((score / total) * 100);
}

function computeOverallScore(
  lighthouse: LighthouseScores,
  metaScore: number,
  contentScore: number,
  techScore: number,
): number {
  // Build weighted components, skipping null lighthouse scores
  let totalWeight = 0;
  let weightedSum = 0;

  if (lighthouse.seo != null) { weightedSum += lighthouse.seo * 0.30; totalWeight += 0.30; }
  if (lighthouse.performance != null) { weightedSum += lighthouse.performance * 0.20; totalWeight += 0.20; }
  if (lighthouse.bestPractices != null) { weightedSum += lighthouse.bestPractices * 0.10; totalWeight += 0.10; }
  if (lighthouse.accessibility != null) { weightedSum += lighthouse.accessibility * 0.10; totalWeight += 0.10; }

  // HTML crawl components always available
  weightedSum += metaScore * 0.15;
  totalWeight += 0.15;
  weightedSum += contentScore * 0.10;
  totalWeight += 0.10;
  weightedSum += techScore * 0.05;
  totalWeight += 0.05;

  // Normalize: if PSI data is missing, scale remaining weights to fill 100%
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

// ── Main Export ─────────────────────────────────────────────────────

export interface AuditEngineResult {
  score: number;
  issuesCount: number;
  pagesCrawled: number;
  results: AuditResults;
  recommendations: Array<{
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string;
  }>;
}

export async function runSeoAudit(domain: string): Promise<AuditEngineResult> {
  const url = `https://${domain}`;

  // Run PSI and HTML crawl in parallel
  const [psiData, html, technical] = await Promise.all([
    fetchPsiData(url),
    fetchHtml(url),
    analyzeTechnical(domain),
  ]);

  const lighthouse = extractLighthouseScores(psiData);
  const coreWebVitals = extractCoreWebVitals(psiData);

  // Parse HTML
  let metaTags: AuditMetaTags;
  let contentStructure: AuditContentStructure;

  if (html) {
    const $ = cheerio.load(html);
    metaTags = analyzeMetaTags($, domain);
    contentStructure = analyzeContentStructure($, domain);
  } else {
    // HTML fetch failed — report what we can
    metaTags = {
      title: { exists: false, value: null, length: 0, optimal: false },
      description: { exists: false, value: null, length: 0, optimal: false },
      ogTitle: false, ogDescription: false, ogImage: false,
      canonical: false, robots: null, viewport: false,
    };
    contentStructure = {
      h1Count: 0, headingHierarchyValid: false,
      totalImages: 0, imagesMissingAlt: 0,
      internalLinks: 0, externalLinks: 0,
    };
  }

  // Generate issues
  const issues = generateIssues(lighthouse, metaTags, contentStructure, technical, coreWebVitals);

  // Compute scores
  const metaScore = computeMetaTagsScore(metaTags);
  const contentScore = computeContentScore(contentStructure);
  const techScore = computeTechnicalScore(technical);
  const overallScore = computeOverallScore(lighthouse, metaScore, contentScore, techScore);

  const results: AuditResults = {
    lighthouse: {
      performance: lighthouse.performance ?? 0,
      seo: lighthouse.seo ?? 0,
      bestPractices: lighthouse.bestPractices ?? 0,
      accessibility: lighthouse.accessibility ?? 0,
    },
    psiAvailable: lighthouse.performance !== null,
    coreWebVitals,
    metaTags,
    contentStructure,
    technical,
    issues,
    url,
    analyzedAt: new Date().toISOString(),
  };

  // Convert issues into recommendation format
  const recommendations = issues.map((issue) => ({
    type: issue.type,
    priority: issue.priority,
    title: issue.title,
    description: issue.description,
  }));

  return {
    score: overallScore,
    issuesCount: issues.length,
    pagesCrawled: 1, // Homepage crawl
    results,
    recommendations,
  };
}

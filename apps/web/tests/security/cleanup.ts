import { APIRequestContext } from '@playwright/test';

/**
 * Shared cleanup utility for security tests.
 *
 * Tracks IDs of resources created during tests and deletes them
 * via the API in the correct order (respecting foreign key constraints).
 */

export interface CreatedResources {
  activities: string[];
  products: string[];
  deals: string[];
  contacts: string[];
  companies: string[];
  employees: string[];
  departments: string[];
  invoices: string[];
  expenses: string[];
  content: string[];
  contentCategories: string[];
  contentTemplates: string[];
  contractTemplates: string[];
  contracts: string[];
  leaveRequests: string[];
  performanceReviews: string[];
  pipelines: string[];
}

export function createResourceTracker(): CreatedResources {
  return {
    activities: [],
    products: [],
    deals: [],
    contacts: [],
    companies: [],
    employees: [],
    departments: [],
    invoices: [],
    expenses: [],
    content: [],
    contentCategories: [],
    contentTemplates: [],
    contractTemplates: [],
    contracts: [],
    leaveRequests: [],
    performanceReviews: [],
    pipelines: [],
  };
}

/**
 * Delete all tracked resources in the correct order.
 * Ignores 404s (already deleted) and logs failures.
 */
export async function cleanupResources(
  request: APIRequestContext,
  resources: CreatedResources
): Promise<void> {
  // Deletion order matters: delete dependents first, then parents
  const deletionPlan: { label: string; ids: string[]; endpoint: string }[] = [
    { label: 'activities', ids: resources.activities, endpoint: '/api/crm/activities' },
    { label: 'products', ids: resources.products, endpoint: '/api/crm/products' },
    { label: 'deals', ids: resources.deals, endpoint: '/api/crm/deals' },
    { label: 'contacts', ids: resources.contacts, endpoint: '/api/crm/contacts' },
    { label: 'performance reviews', ids: resources.performanceReviews, endpoint: '/api/hr/reviews' },
    { label: 'leave requests', ids: resources.leaveRequests, endpoint: '/api/hr/leave' },
    { label: 'contracts', ids: resources.contracts, endpoint: '/api/hr/contracts' },
    { label: 'contract templates', ids: resources.contractTemplates, endpoint: '/api/hr/contract-templates' },
    { label: 'employees', ids: resources.employees, endpoint: '/api/hr/employees' },
    { label: 'departments', ids: resources.departments, endpoint: '/api/hr/departments' },
    { label: 'invoices', ids: resources.invoices, endpoint: '/api/finance/invoices' },
    { label: 'expenses', ids: resources.expenses, endpoint: '/api/finance/expenses' },
    { label: 'content', ids: resources.content, endpoint: '/api/content' },
    { label: 'content categories', ids: resources.contentCategories, endpoint: '/api/content/categories' },
    { label: 'content templates', ids: resources.contentTemplates, endpoint: '/api/content/templates' },
    { label: 'companies', ids: resources.companies, endpoint: '/api/crm/companies' },
    { label: 'pipelines', ids: resources.pipelines, endpoint: '/api/crm/pipelines' },
  ];

  for (const { label, ids, endpoint } of deletionPlan) {
    if (ids.length === 0) continue;

    let deleted = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await request.delete(`${endpoint}/${id}`);
        const status = res.status();
        if (status === 200 || status === 204 || status === 404) {
          deleted++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (deleted > 0 || failed > 0) {
      console.log(
        `[Cleanup] ${label}: ${deleted} deleted, ${failed} failed, ${ids.length} total`
      );
    }
  }
}

/**
 * Helper: extract ID from a successful POST/PATCH response.
 * Returns the ID string if found, or null.
 */
export async function extractCreatedId(
  res: { status: () => number; json: () => Promise<unknown> }
): Promise<string | null> {
  const status = res.status();
  if (status === 200 || status === 201) {
    try {
      const body = (await res.json()) as { data?: { id?: string } };
      return body?.data?.id ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

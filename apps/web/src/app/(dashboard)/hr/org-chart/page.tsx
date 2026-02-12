'use client';

import { PageHeader, Card, CardContent, Badge, Skeleton } from '@ccd/ui';
import { useEmployees } from '@/hooks/use-hr';
import { ArrowLeft, GitBranch } from 'lucide-react';
import Link from 'next/link';

interface OrgNode {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department?: { id: string; name: string } | null;
  avatar_url: string | null;
  status: string;
  manager_id: string | null;
  children: OrgNode[];
}

function buildTree(employees: OrgNode[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  const roots: OrgNode[] = [];

  employees.forEach((emp) => {
    map.set(emp.id, { ...emp, children: [] });
  });

  map.forEach((node) => {
    if (node.manager_id && map.has(node.manager_id)) {
      map.get(node.manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function OrgNodeCard({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  return (
    <div className="flex flex-col items-center">
      <Link href={`/hr/employees/${node.id}`}>
        <Card className="w-56 cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-700">
              {getInitials(node.first_name, node.last_name)}
            </div>
            <p className="font-medium">
              {node.first_name} {node.last_name}
            </p>
            {node.job_title && (
              <p className="text-sm text-muted-foreground">{node.job_title}</p>
            )}
            {node.department && (
              <Badge variant="outline" className="mt-1 text-xs">
                {node.department.name}
              </Badge>
            )}
          </CardContent>
        </Card>
      </Link>

      {node.children.length > 0 && (
        <>
          <div className="h-6 w-px bg-border" />
          <div className="relative flex gap-6">
            {node.children.length > 1 && (
              <div
                className="absolute left-1/2 top-0 h-px -translate-x-1/2 bg-border"
                style={{
                  width: `calc(100% - 14rem)`,
                }}
              />
            )}
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="h-6 w-px bg-border" />
                <OrgNodeCard node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-32 w-56 rounded-lg" />
      <div className="flex gap-6">
        <Skeleton className="h-32 w-56 rounded-lg" />
        <Skeleton className="h-32 w-56 rounded-lg" />
        <Skeleton className="h-32 w-56 rounded-lg" />
      </div>
    </div>
  );
}

export default function OrgChartPage() {
  const { data: response, isLoading } = useEmployees({
    status: 'active',
    limit: 500,
    sort: 'last_name',
  });

  const employees = (response?.data as OrgNode[]) ?? [];
  const tree = buildTree(employees);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/hr"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Organization Chart"
          description="Visual hierarchy of your organization"
        />
      </div>

      {isLoading ? (
        <OrgChartSkeleton />
      ) : tree.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Organization Data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add employees and assign managers to build your org chart.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-8">
          <div className="flex min-w-max flex-col items-center gap-2">
            {tree.map((root) => (
              <OrgNodeCard key={root.id} node={root} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

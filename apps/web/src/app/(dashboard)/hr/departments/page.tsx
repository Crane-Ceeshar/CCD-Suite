'use client';

import { useState } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
} from '@ccd/ui';
import { Plus, Building2, Loader2, Users } from 'lucide-react';
import { useDepartments, useCreateDepartment } from '@/hooks/use-hr';

function DepartmentCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  );
}

export default function DepartmentsPage() {
  const { data: response, isLoading } = useDepartments();
  const departments = (response?.data as any[]) ?? [];

  const createDepartment = useCreateDepartment();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createDepartment.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setNewName('');
      setNewDescription('');
      setShowForm(false);
    } catch {
      // Error handled by React Query
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage departments and team structure"
      >
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </PageHeader>

      {/* Inline add form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dept_name">Name</Label>
              <Input
                id="dept_name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div>
              <Label htmlFor="dept_description">Description</Label>
              <Input
                id="dept_description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Software engineering team"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createDepartment.isPending || !newName.trim()}>
                {createDepartment.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DepartmentCardSkeleton />
          <DepartmentCardSkeleton />
          <DepartmentCardSkeleton />
        </div>
      ) : !departments.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No departments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create departments to organise your team
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept: any) => (
            <Card key={dept.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{dept.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {dept.description || 'No description'}
                </p>
                {dept.employee_count !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{dept.employee_count} employee{dept.employee_count !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {dept.head && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-medium">
                      {dept.head.first_name?.[0]}{dept.head.last_name?.[0]}
                    </div>
                    <span>{dept.head.first_name} {dept.head.last_name}</span>
                    <span className="text-muted-foreground">· Head</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

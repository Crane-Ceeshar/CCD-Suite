'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button } from '@ccd/ui';
import { Plus, Building2 } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage departments and team structure"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </PageHeader>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No departments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create departments to organise your team
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{dept.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {dept.description || 'No description'}
                </p>
                {dept.head && (
                  <div className="flex items-center gap-2 text-sm">
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

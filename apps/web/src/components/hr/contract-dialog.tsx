'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@ccd/ui';
import { Loader2 } from 'lucide-react';
import { useCreateContract, useEmployees, useContractTemplates } from '@/hooks/use-hr';

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
}

export function ContractDialog({ open, onOpenChange, employeeId }: ContractDialogProps) {
  const [tab, setTab] = useState('blank');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('employment');
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const createContract = useCreateContract();
  const { data: empResponse } = useEmployees({ status: 'active', limit: 200 });
  const employees = (empResponse?.data as any[]) ?? [];
  const { data: tplResponse } = useContractTemplates({ is_active: 'true' });
  const templates = (tplResponse?.data as any[]) ?? [];

  const resetForm = () => {
    setTab('blank');
    setTitle('');
    setType('employment');
    setSelectedEmployee(employeeId || '');
    setSelectedTemplate('');
    setContent('');
    setExpiresAt('');
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !title.trim()) return;

    const contractData: Record<string, unknown> = {
      employee_id: selectedEmployee,
      title: title.trim(),
      type,
      expires_at: expiresAt || null,
    };

    if (tab === 'template' && selectedTemplate) {
      contractData.template_id = selectedTemplate;
    } else if (tab === 'blank' && content.trim()) {
      contractData.content = [{ title: 'Terms and Conditions', content: content.trim() }];
    }

    try {
      await createContract.mutateAsync(contractData);
      resetForm();
      onOpenChange(false);
    } catch {
      // error handled by React Query
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Contract</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contract Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Employment Agreement - John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contract Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="blank" className="flex-1">Blank</TabsTrigger>
              <TabsTrigger value="template" className="flex-1">From Template</TabsTrigger>
            </TabsList>
            <TabsContent value="blank" className="mt-4">
              <div className="space-y-2">
                <Label>Contract Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter contract terms and conditions..."
                  rows={6}
                />
              </div>
            </TabsContent>
            <TabsContent value="template" className="mt-4">
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((tpl: any) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No templates available. Create one first.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createContract.isPending || !selectedEmployee || !title.trim()}
          >
            {createContract.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

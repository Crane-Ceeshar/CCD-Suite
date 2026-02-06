export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  color: string | null;
  metadata: Record<string, unknown>;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  tenant_id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  estimated_hours: number | null;
  position: number;
  metadata: Record<string, unknown>;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  tenant_id: string;
  task_id: string;
  user_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  is_running: boolean;
  created_at: string;
}

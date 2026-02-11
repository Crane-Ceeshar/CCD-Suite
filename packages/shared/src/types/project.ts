export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MemberRole = 'owner' | 'manager' | 'member' | 'viewer';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  currency: string;
  color: string | null;
  client_id: string | null;
  metadata: Record<string, unknown>;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
  tasks?: Task[];
  // Computed joins
  task_count?: number;
  completed_task_count?: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  // Joined
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

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
  start_date: string | null;
  estimated_hours: number | null;
  position: number;
  labels: string[];
  story_points: number | null;
  sprint_id: string | null;
  metadata: Record<string, unknown>;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  subtasks?: Task[];
  assignee?: {
    full_name: string | null;
    avatar_url: string | null;
  };
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
  billable: boolean;
  hourly_rate: number | null;
  invoice_id: string | null;
  created_at: string;
  // Joined
  task?: { title: string; project_id: string };
}

export interface Sprint {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  capacity_points: number | null;
  created_at: string;
  updated_at: string;
  // Computed
  total_points?: number;
  completed_points?: number;
  task_count?: number;
}

export interface BurndownPoint {
  date: string;
  remaining_points: number;
  ideal_points: number;
}

export interface VelocityData {
  sprint_name: string;
  planned_points: number;
  completed_points: number;
  carry_over: number;
}

export interface TimesheetRow {
  task_id: string;
  task_title: string;
  project_name: string;
  entries: Record<string, number>; // date string → minutes
  total_minutes: number;
  billable_minutes: number;
}

export interface TimesheetSummary {
  rows: TimesheetRow[];
  total_minutes: number;
  billable_minutes: number;
  total_cost: number;
}

// ── Input Types ──

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  due_date?: string | null;
  budget?: number | null;
  currency?: string;
  color?: string | null;
  client_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  due_date?: string | null;
  budget?: number | null;
  currency?: string;
  color?: string | null;
  client_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateProjectMemberInput {
  user_id: string;
  role?: MemberRole;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  start_date?: string | null;
  estimated_hours?: number | null;
  assigned_to?: string | null;
  parent_id?: string | null;
  labels?: string[];
  story_points?: number | null;
  sprint_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  start_date?: string | null;
  estimated_hours?: number | null;
  assigned_to?: string | null;
  parent_id?: string | null;
  labels?: string[];
  position?: number;
  story_points?: number | null;
  sprint_id?: string | null;
  metadata?: Record<string, unknown>;
}

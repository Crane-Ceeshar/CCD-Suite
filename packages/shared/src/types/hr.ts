export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';
export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';
export type PayrollStatus = 'draft' | 'processing' | 'completed' | 'cancelled';

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  head_id: string | null;
  created_at: string;
  // Joined
  head?: Employee;
  employees?: Employee[];
}

export interface Employee {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
  job_title: string | null;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  hire_date: string;
  termination_date: string | null;
  salary: number | null;
  salary_currency: string;
  manager_id: string | null;
  avatar_url: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  department?: Department;
  manager?: Employee;
}

export interface LeaveRequest {
  id: string;
  tenant_id: string;
  employee_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  employee?: Employee;
}

export interface AttendanceRecord {
  id: string;
  tenant_id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  // Joined
  employee?: Employee;
}

export interface PayrollRun {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  status: PayrollStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  currency: string;
  processed_by: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  gross_amount: number;
  deductions: number;
  net_amount: number;
  breakdown: Record<string, unknown>;
  created_at: string;
  // Joined
  employee?: Employee;
}

export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department_id?: string;
  job_title?: string;
  employment_type?: EmploymentType;
  hire_date?: string;
  salary?: number;
  salary_currency?: string;
  manager_id?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface UpdateEmployeeInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department_id?: string;
  job_title?: string;
  employment_type?: EmploymentType;
  status?: EmployeeStatus;
  salary?: number;
  manager_id?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface CreateLeaveRequestInput {
  employee_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
}

export interface CreateAttendanceInput {
  employee_id: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface CreatePayrollRunInput {
  period_start: string;
  period_end: string;
  currency?: string;
  notes?: string;
}

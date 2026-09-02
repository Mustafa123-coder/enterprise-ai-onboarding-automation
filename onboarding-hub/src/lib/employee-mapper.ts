import type { Employee, OnboardingPlan } from "@/lib/types";

type EmployeeRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  location: string;
  manager_name: string;
  start_date: string | Date;
  status: Employee["status"];
  progress: number;
  completed_tasks: number;
  total_tasks: number;
  created_at: string | Date;
  latest_plan?: OnboardingPlan | null;
};

export function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    department: row.department,
    location: row.location,
    managerName: row.manager_name,
    startDate: new Date(row.start_date).toISOString(),
    status: row.status,
    progress: Number(row.progress),
    completedTasks: Number(row.completed_tasks),
    totalTasks: Number(row.total_tasks),
    createdAt: new Date(row.created_at).toISOString(),
    latestPlan: row.latest_plan ?? null,
  };
}

export type EmployeeStatus = "DRAFT" | "ON_TRACK" | "AT_RISK" | "READY";

export type Employee = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  location: string;
  managerName: string;
  startDate: string;
  status: EmployeeStatus;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  createdAt: string;
  latestPlan?: OnboardingPlan | null;
};

export type PlanItem = {
  day: number;
  title: string;
  purpose: string;
  owner: string;
  durationMinutes: number;
};

export type OnboardingPlan = {
  id?: string;
  summary: string;
  welcomeNote: string;
  priorities: string[];
  schedule: PlanItem[];
  managerActions: string[];
  risks: string[];
  model?: string;
  createdAt?: string;
};

export type DashboardResponse = {
  employees: Employee[];
  metrics: {
    active: number;
    ready: number;
    atRisk: number;
    averageProgress: number;
  };
};

import { z } from "zod";

const cleanText = (label: string, max = 100) =>
  z.string().trim().min(2, `${label} is required`).max(max, `${label} is too long`);

export const createEmployeeSchema = z.object({
  fullName: cleanText("Full name"),
  email: z.string().trim().email("Enter a valid email").max(254),
  role: cleanText("Role"),
  department: cleanText("Department"),
  location: cleanText("Location"),
  managerName: cleanText("Manager name"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid start date"),
});

export const createPlanSchema = z.object({ employeeId: z.string().uuid() });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

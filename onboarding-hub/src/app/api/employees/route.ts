import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { mapEmployee } from "@/lib/employee-mapper";
import { createEmployeeSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT e.*,
        (SELECT p.plan FROM onboarding_plans p
         WHERE p.employee_id = e.id ORDER BY p.created_at DESC LIMIT 1) AS latest_plan
      FROM employees e
      ORDER BY e.start_date ASC
    `;
    const employees = rows.map((row) => mapEmployee(row as never));
    const active = employees.length;
    const ready = employees.filter((employee) => employee.status === "READY").length;
    const atRisk = employees.filter((employee) => employee.status === "AT_RISK").length;
    const averageProgress = active
      ? Math.round(employees.reduce((total, employee) => total + employee.progress, 0) / active)
      : 0;

    return NextResponse.json({ employees, metrics: { active, ready, atRisk, averageProgress } });
  } catch (error) {
    console.error("Failed to load employees", error);
    return NextResponse.json(
      { error: "The onboarding workspace is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = createEmployeeSchema.parse(await request.json());
    const sql = db();
    const [row] = await sql`
      INSERT INTO employees
        (full_name, email, role, department, location, manager_name, start_date, status)
      VALUES
        (${input.fullName}, ${input.email.toLowerCase()}, ${input.role}, ${input.department},
         ${input.location}, ${input.managerName}, ${input.startDate}, 'DRAFT')
      RETURNING *
    `;

    return NextResponse.json({ employee: mapEmployee(row as never) }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please correct the highlighted fields.", fields: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "An employee with this email already exists." }, { status: 409 });
    }
    console.error("Failed to create employee", error);
    return NextResponse.json({ error: "We could not create this onboarding record." }, { status: 500 });
  }
}

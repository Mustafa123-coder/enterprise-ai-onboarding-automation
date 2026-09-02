import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateOnboardingPlan } from "@/lib/ai";
import { db } from "@/lib/db";
import { mapEmployee } from "@/lib/employee-mapper";
import { createPlanSchema } from "@/lib/schemas";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { employeeId } = createPlanSchema.parse(await request.json());
    const sql = db();
    const [row] = await sql`SELECT * FROM employees WHERE id = ${employeeId}`;
    if (!row) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

    const employee = mapEmployee(row as never);
    const plan = await generateOnboardingPlan(employee);
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    const [saved] = await sql`
      INSERT INTO onboarding_plans (employee_id, plan, model, prompt_version)
      VALUES (${employeeId}, ${sql.json(plan as never)}, ${model}, 'plan-v1')
      RETURNING id, created_at
    `;

    return NextResponse.json({
      plan: { ...plan, id: saved.id, model, createdAt: new Date(saved.created_at).toISOString() },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "A valid employee ID is required." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "AI_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "AI planning is not configured. Add OPENAI_API_KEY to the environment." },
        { status: 503 },
      );
    }
    console.error("Failed to generate onboarding plan", error);
    return NextResponse.json(
      { error: "The AI planner could not complete this request. Please try again." },
      { status: 502 },
    );
  }
}

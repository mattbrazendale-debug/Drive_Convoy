import { NextResponse } from "next/server";
import { createClass, ensureDemoTeacher } from "@/lib/session-service";
import { DEMO_SCHOOL_ID, DEMO_TEACHER_ID } from "@/lib/config";
import { prisma } from "@/lib/db";

export async function GET() {
  await ensureDemoTeacher(DEMO_TEACHER_ID, DEMO_SCHOOL_ID);
  const classes = await prisma.classGroup.findMany({
    where: { teacherId: DEMO_TEACHER_ID, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { roster: { where: { active: true } } },
  });
  return NextResponse.json({ classes });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name || name.length > 60) {
    return NextResponse.json({ error: "Give your class a name so you can find it later" }, { status: 400 });
  }
  await ensureDemoTeacher(DEMO_TEACHER_ID, DEMO_SCHOOL_ID);
  const yearLevel = body.yearLevel ? Number(body.yearLevel) : undefined;
  const idempotencyKey = req.headers.get("Idempotency-Key") ?? undefined;
  const cls = await createClass({
    teacherId: DEMO_TEACHER_ID,
    schoolId: DEMO_SCHOOL_ID,
    name,
    yearLevel,
    idempotencyKey,
  });
  return NextResponse.json({ class: cls });
}

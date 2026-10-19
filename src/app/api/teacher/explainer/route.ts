import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_TEACHER_ID, DEMO_SCHOOL_ID } from "@/lib/config";
import { ensureDemoTeacher } from "@/lib/session-service";

export async function POST() {
  await ensureDemoTeacher(DEMO_TEACHER_ID, DEMO_SCHOOL_ID);
  await prisma.teacher.update({
    where: { id: DEMO_TEACHER_ID },
    data: { explainerSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  await ensureDemoTeacher(DEMO_TEACHER_ID, DEMO_SCHOOL_ID);
  const teacher = await prisma.teacher.findUnique({ where: { id: DEMO_TEACHER_ID } });
  return NextResponse.json({ seen: !!teacher?.explainerSeenAt });
}

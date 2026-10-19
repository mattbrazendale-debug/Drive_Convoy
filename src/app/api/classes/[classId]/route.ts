import { NextResponse } from "next/server";
import { getClassHome } from "@/lib/session-service";

export async function GET(_: Request, ctx: { params: Promise<{ classId: string }> }) {
  const { classId } = await ctx.params;
  const home = await getClassHome(classId);
  if (!home) return NextResponse.json({ error: "Class not found" }, { status: 404 });
  return NextResponse.json(home);
}

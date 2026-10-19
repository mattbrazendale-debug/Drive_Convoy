import { NextResponse } from "next/server";
import { saveRoster } from "@/lib/session-service";

export async function POST(req: Request, ctx: { params: Promise<{ classId: string }> }) {
  const { classId } = await ctx.params;
  const body = await req.json();
  const entries = body.entries as {
    givenName: string;
    familyInitial?: string;
    displayName: string;
  }[];
  if (!entries?.length) {
    return NextResponse.json({ error: "Add at least one student" }, { status: 400 });
  }
  try {
    const count = await saveRoster(classId, entries);
    return NextResponse.json({ count, message: `${count} students added` });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getJoinLobby, isSessionCodeExpired } from "@/lib/session-service";
import { normalizeJoinCode } from "@/lib/join-code";

export async function POST(req: Request) {
  const body = await req.json();
  const joinCode = normalizeJoinCode(String(body.joinCode ?? ""));
  const lobby = await getJoinLobby(joinCode);
  if (!lobby) {
    return NextResponse.json(
      { error: "That code doesn't match a convoy. Check the screen and try again." },
      { status: 404 },
    );
  }
  if (isSessionCodeExpired(lobby.session)) {
    return NextResponse.json({ error: "This leg has finished. See you on the next one." }, { status: 410 });
  }
  if (lobby.ended) {
    return NextResponse.json({ error: "This leg has finished. See you on the next one." }, { status: 410 });
  }
  return NextResponse.json({
    sessionId: lobby.session.id,
    leg: lobby.leg,
    roster: lobby.roster,
    onBoardCount: lobby.onBoardCount,
    rosterCount: lobby.rosterCount,
    status: lobby.session.status,
  });
}

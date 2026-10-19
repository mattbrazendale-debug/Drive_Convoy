"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/realtime";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function getSocket() {
  if (!socket) {
    socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
  }
  return socket;
}

export function useSessionRealtime(
  sessionId: string | undefined,
  role: "projector" | "dispatch" | "student",
  onUpdate: () => void,
  onLegStarting?: (startsAt: number) => void,
) {
  useEffect(() => {
    if (!sessionId) return;
    const s = getSocket();
    s.emit("subscribe_session", sessionId, role);
    const refresh = () => onUpdate();
    s.on("session_updated", refresh);
    const legHandler = (payload: { startsAt: number }) => {
      onLegStarting?.(payload.startsAt);
    };
    s.on("leg_starting", legHandler);
    return () => {
      s.off("session_updated", refresh);
      s.off("leg_starting", legHandler);
    };
  }, [sessionId, role, onUpdate, onLegStarting]);
}

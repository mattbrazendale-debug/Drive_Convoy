import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "./src/lib/realtime";
import { sessionRoom, teacherRoom } from "./src/lib/realtime";
import { setRealtimeBus } from "./src/lib/realtime-bus";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

export const ioRef: { io?: Server<ClientToServerEvents, ServerToClientEvents> } = {};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });
  ioRef.io = io;

  setRealtimeBus({
    broadcastSession: (sessionId) => broadcastSession(sessionId),
    broadcastTeacher: (teacherId, sessionId) => broadcastTeacher(teacherId, sessionId),
    emitLegStarting: (sessionId, startsAt) => {
      io.to(sessionRoom(sessionId, "student")).emit("leg_starting", { sessionId, startsAt });
      io.to(sessionRoom(sessionId, "projector")).emit("leg_starting", { sessionId, startsAt });
      io.to(sessionRoom(sessionId, "dispatch")).emit("leg_starting", { sessionId, startsAt });
    },
  });

  io.on("connection", (socket) => {
    socket.on("subscribe_session", (sessionId, role) => {
      socket.join(sessionRoom(sessionId, role));
      if (role === "projector") socket.join(sessionRoom(sessionId, "projector"));
    });
    socket.on("subscribe_teacher", (teacherId) => {
      socket.join(teacherRoom(teacherId));
    });
  });

  httpServer.listen(port, () => {
    console.log(`Convoy + Dispatch ready on http://${hostname}:${port}`);
  });
});

export function broadcastSession(sessionId: string) {
  ioRef.io?.to(sessionRoom(sessionId, "projector")).emit("session_updated", { sessionId });
  ioRef.io?.to(sessionRoom(sessionId, "dispatch")).emit("session_updated", { sessionId });
  ioRef.io?.to(sessionRoom(sessionId, "student")).emit("session_updated", { sessionId });
}

export function broadcastTeacher(teacherId: string, sessionId: string) {
  ioRef.io?.to(teacherRoom(teacherId)).emit("session_updated", { sessionId });
}

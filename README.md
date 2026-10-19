# Convoy + Dispatch (Drive Classroom Concept)

Near-term **Dispatch lite** MVP from the product story map:

- Teacher setup: create class, paste roster, trip overview (6 legs)
- Launch leg on **Convoy Screen** (projector): join code, QR, on-board count only (no student names)
- **Dispatch** on a second device: lobby, signals, ranked check-ins with “Flagged because…”, pause/resume, tows (hint, buddy, rest stop)
- **Student join** via code + name (no accounts)
- Shared **fuel gauge** driven by class answers (MVP scoring rules)
- Rule-based dispatch signals (no adaptive lanes yet — Phase 3)

## Stack

- Next.js 15 (App Router) + TypeScript
- Custom Node server with Socket.IO (WebSocket + polling fallback)
- Prisma + SQLite locally (schema matches Postgres-oriented models from the spec)

## Run locally

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Typical classroom flow

1. **Teacher** → New Convoy class → paste roster → **Launch leg** (opens Convoy Screen + Dispatch).
2. **Projector** → Convoy Screen window fullscreen.
3. **Students** → `/join` or QR → pick name → answer questions on their devices.
4. **Teacher** → Dispatch → **Start the engines** → act on check-ins / send tows while monitoring signals.

## Routes

| Route | Role |
|-------|------|
| `/` | Teacher home |
| `/classes/new` | Create class |
| `/classes/[id]` | Trip overview & launch |
| `/classes/[id]/roster` | Paste roster |
| `/convoy/[sessionId]` | Projector Convoy Screen |
| `/dispatch/[sessionId]` | Teacher Dispatch |
| `/join` | Student entry |
| `/drive/[sessionId]` | Student questions |

## Production notes (from spec)

- Swap `DATABASE_URL` to Postgres; keep Prisma models.
- Replace demo teacher auth with Drive SSO.
- Move real-time to a managed NZ/AU WebSocket provider if required.
- Personal lanes, seating plan, SMS import, and Paper Trail are story-mapped as V1.1+.

## PDF coverage

This build implements MVP (🟢) stories through **Launch the Leg** and **Join the Convoy** in the handoff PDF, plus **Drive**, **Dispatch**, **Tow**, and **Arrive** behaviour described in the product canvas and concept breakdown. Stories marked 🟡/🔴 in the doc (SMS import, seating plan, adaptive lanes, Pit Crews) are not implemented here.

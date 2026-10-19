"use client";

import { api } from "@/lib/api";

export function DispatchExplainer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const dismiss = async () => {
    await api("/api/teacher/explainer", { method: "POST" });
    onClose();
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-labelledby="dispatch-explainer-title">
      <div className="modal card stack">
        <h2 id="dispatch-explainer-title">Dispatch is a prompt, not a verdict.</h2>
        <div className="row" style={{ alignItems: "stretch" }}>
          <div className="card" style={{ flex: 1, background: "var(--surface-2)" }}>
            <h3>It is</h3>
            <ul>
              <li>A short list of up to 3 students worth a check-in, with the reason why.</li>
              <li>A live sense of who&apos;s on track, slowing, stalled or racing ahead.</li>
              <li>Yours alone. Students never see it.</li>
            </ul>
          </div>
          <div className="card" style={{ flex: 1, background: "var(--surface-2)" }}>
            <h3>It isn&apos;t</h3>
            <ul>
              <li>A ranking or a grade.</li>
              <li>Something that messages students without you.</li>
              <li>Always right. Dismiss anything that doesn&apos;t fit.</li>
            </ul>
          </div>
        </div>
        <p className="muted">
          Signals start after a student&apos;s first 3 answers. Slow answers alone never mark a student as
          stalled.
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={dismiss}>Got it</button>
        </div>
      </div>
    </div>
  );
}

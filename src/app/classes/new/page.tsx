"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!name.trim()) {
      setError("Give your class a name so you can find it later");
      return;
    }
    setLoading(true);
    try {
      const { class: cls } = await api<{ class: { id: string } }>("/api/classes", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), yearLevel: yearLevel || undefined }),
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });
      router.push(`/classes/${cls.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }} className="stack">
      <Link href="/" className="muted">← Back</Link>
      <h1>New Convoy class</h1>
      <div>
        <div className="label">Class name</div>
        <input
          className="input"
          placeholder="e.g. Year 11 Drive – Room B4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <div>
        <div className="label">Year level (optional)</div>
        <select className="input" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)}>
          <option value="">Select…</option>
          {[10, 11, 12, 13].map((y) => (
            <option key={y} value={y}>Year {y}</option>
          ))}
        </select>
      </div>
      <div className="card">
        <strong>Learner Licence Road Trip</strong>
        <p className="muted">6 legs · 20 minutes each · Landmarks from Waitomo to Aoraki</p>
      </div>
      {error && <div className="banner error">{error}</div>}
      <button type="button" className="btn" disabled={loading || !name.trim()} onClick={submit}>
        Create class
      </button>
    </main>
  );
}

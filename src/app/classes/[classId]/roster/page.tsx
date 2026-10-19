"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { parseRosterInput } from "@/lib/roster-parser";
import { api } from "@/lib/api";

export default function RosterPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const parsed = useMemo(() => parseRosterInput(input), [input]);
  const rows = parsed.rows.map((r, i) => ({
    ...r,
    displayName: edits[i] ?? r.displayName,
  }));
  const duplicates = useMemo(() => {
    const counts = new Map<string, number>();
    rows.filter((r) => r.valid).forEach((r) => counts.set(r.displayName, (counts.get(r.displayName) ?? 0) + 1));
    return [...counts.entries()].filter(([, n]) => n > 1).map(([n]) => n);
  }, [rows]);

  const canSave =
    rows.some((r) => r.valid) &&
    duplicates.length === 0 &&
    rows.filter((r) => r.valid).length <= 40;

  const save = async () => {
    setError("");
    setMessage("");
    const entries = rows
      .filter((r) => r.valid)
      .map((r) => ({
        givenName: r.givenName,
        familyInitial: r.familyInitial,
        displayName: r.displayName,
      }));
    try {
      const res = await api<{ message: string }>(`/api/classes/${classId}/roster`, {
        method: "POST",
        body: JSON.stringify({ entries }),
      });
      setMessage(res.message);
      router.push(`/classes/${classId}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }} className="stack">
      <Link href={`/classes/${classId}`} className="muted">← Class home</Link>
      <h1>Add your students</h1>
      <p className="muted">We only keep first names and a last initial.</p>
      <textarea
        className="textarea"
        placeholder="Paste your class list, one name per line."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {parsed.invalidCount > 0 && (
        <div className="banner">We skipped {parsed.invalidCount} lines that didn&apos;t look like names.</div>
      )}
      {duplicates.length > 0 && (
        <div className="banner">
          Two students would show as &apos;{duplicates[0]}&apos;. Add another letter so they can find the right name.
        </div>
      )}
      {rows.some((r) => r.valid) && (
        <div className="card stack">
          <strong>Preview</strong>
          {rows.filter((r) => r.valid).map((r, i) => (
            <input
              key={i}
              className="input"
              value={edits[i] ?? r.displayName}
              onChange={(e) => setEdits((prev) => ({ ...prev, [i]: e.target.value }))}
            />
          ))}
        </div>
      )}
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}
      <button type="button" className="btn" disabled={!canSave} onClick={save}>Save roster</button>
    </main>
  );
}

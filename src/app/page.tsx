"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ClassRow {
  id: string;
  name: string;
  roster: { id: string }[];
}

export default function TeacherHomePage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);

  useEffect(() => {
    api<{ classes: ClassRow[] }>("/api/classes").then((d) => setClasses(d.classes));
  }, []);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }} className="stack">
      <header className="stack">
        <p className="muted">Drive · Convoy + Dispatch</p>
        <h1 style={{ margin: 0 }}>Your convoy starts here</h1>
        <p className="muted">
          A shared classroom road trip with a live dispatch view for who needs a check-in.
        </p>
      </header>
      <div className="row">
        <Link className="btn" href="/classes/new">New Convoy class</Link>
        <Link className="btn ghost" href="/join">Student join</Link>
      </div>
      {classes.length === 0 ? (
        <div className="card">
          <p>Your convoy starts here. Create a class to plan your first leg.</p>
        </div>
      ) : (
        <div className="stack">
          {classes.map((c) => (
            <Link key={c.id} href={`/classes/${c.id}`} className="card" style={{ display: "block" }}>
              <strong>{c.name}</strong>
              <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                {c.roster.length} students on the roster
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

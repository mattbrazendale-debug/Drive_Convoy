import { NAME_MAX_CHARS, ROSTER_MAX } from "./constants";

export interface ParsedRosterRow {
  givenName: string;
  familyInitial?: string;
  displayName: string;
  valid: boolean;
  reason?: string;
}

export interface ParseResult {
  rows: ParsedRosterRow[];
  invalidCount: number;
  duplicateDisplayNames: string[];
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function parseLine(line: string): ParsedRosterRow {
  const name = collapseWhitespace(line);
  if (!name) {
    return { givenName: "", displayName: "", valid: false, reason: "empty" };
  }
  if (name.length > NAME_MAX_CHARS || /\d/.test(name)) {
    return { givenName: name, displayName: name, valid: false, reason: "invalid" };
  }
  const parts = name.split(" ");
  const given = parts[0];
  const initial = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : undefined;
  const display = initial ? `${given} ${initial}.` : given;
  return { givenName: given, familyInitial: initial, displayName: display.normalize("NFC"), valid: true };
}

export function parseRosterInput(input: string): ParseResult {
  const lines = input.split(/\r?\n|,|\t/).map((l) => l.trim()).filter(Boolean);
  const rows = lines.slice(0, ROSTER_MAX + 1).map(parseLine);
  const validRows = rows.filter((r) => r.valid);
  const invalidCount = rows.filter((r) => !r.valid).length;
  const counts = new Map<string, number>();
  for (const r of validRows) {
    counts.set(r.displayName, (counts.get(r.displayName) ?? 0) + 1);
  }
  const duplicateDisplayNames = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([name]) => name);
  return { rows: rows.slice(0, ROSTER_MAX), invalidCount, duplicateDisplayNames };
}

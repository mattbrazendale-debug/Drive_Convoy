import { JOIN_ALPHABET, JOIN_CODE_LENGTH } from "./constants";

export function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    code += JOIN_ALPHABET[Math.floor(Math.random() * JOIN_ALPHABET.length)];
  }
  return code;
}

export function normalizeJoinCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase().slice(0, JOIN_CODE_LENGTH);
}

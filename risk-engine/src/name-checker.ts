const FAKE_NAME_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^test/i, reason: "Contains 'test'" },
  { pattern: /^asdf/i, reason: "Keyboard pattern" },
  { pattern: /^qwerty/i, reason: "Keyboard pattern" },
  { pattern: /^admin/i, reason: "Contains 'admin'" },
  { pattern: /^user/i, reason: "Generic 'user' name" },
  { pattern: /^null$/i, reason: "Name is 'null'" },
  { pattern: /^undefined$/i, reason: "Name is 'undefined'" },
  { pattern: /^abc$/i, reason: "Sequential letters" },
  { pattern: /^xyz$/i, reason: "Random letters" },
  { pattern: /^xxx+$/i, reason: "Repeated characters" },
  { pattern: /^aaa+$/i, reason: "Repeated characters" },
  { pattern: /^\d+$/, reason: "All numbers" },
  { pattern: /^[a-z]\d+$/i, reason: "Letter followed by numbers" },
  { pattern: /^.{0,1}$/, reason: "Name too short" },
  { pattern: /^\S+@\S+$/, reason: "Email used as name" },
  { pattern: /^\+?\d{7,}$/, reason: "Phone number as name" },
];

const COMMON_FAKE_NAMES = new Set([
  "john doe",
  "jane doe",
  "test user",
  "demo user",
  "sample",
  "temp",
  "fake",
  "xyz",
  "abc",
  "aa",
  "bb",
  "cc",
]);

interface NameRiskResult {
  score: number;
  reason?: string;
}

export function checkNameRisk(name: string | undefined): NameRiskResult {
  if (!name || name.trim().length === 0) {
    return { score: 0.7, reason: "No name provided" };
  }

  const normalized = name.trim().toLowerCase();

  if (COMMON_FAKE_NAMES.has(normalized)) {
    return { score: 0.95, reason: "Common fake/test name" };
  }

  for (const { pattern, reason } of FAKE_NAME_PATTERNS) {
    if (pattern.test(normalized)) {
      return { score: 0.9, reason };
    }
  }

  if (normalized.length < 3) {
    return { score: 0.7, reason: "Name too short (< 3 chars)" };
  }

  if (normalized === normalized.toUpperCase() && normalized.length > 3) {
    return { score: 0.6, reason: "All uppercase without spaces" };
  }

  const words = normalized.split(/\s+/);
  if (words.length === 1 && normalized.length > 15) {
    return { score: 0.6, reason: "Single very long word" };
  }

  const hasOnlyAscii = /^[\x00-\x7F]*$/.test(normalized);
  if (!hasOnlyAscii) {
    return { score: 0.4, reason: "Non-ASCII characters in name" };
  }

  if (normalized.length >= 3 && words.length >= 1) {
    return { score: 0.05, reason: "Looks like a real name" };
  }

  return { score: 0.3, reason: "Unusual name pattern" };
}

export type ScoringLogic = { type: "sum" | "average" };

export type ResultRange = {
  min: number;
  max: number;
  label: string;
  description?: string;
  recommendation?: string;
};

export type TestSoru = {
  id: string;
  text: string;
  options: { value: number; label: string }[];
};

export function parseScoringLogic(raw: unknown): ScoringLogic {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    ((raw as { type?: unknown }).type === "sum" ||
      (raw as { type?: unknown }).type === "average")
  ) {
    return { type: (raw as { type: "sum" | "average" }).type };
  }
  return { type: "sum" };
}

export function parseResultRanges(raw: unknown): ResultRange[] {
  if (!Array.isArray(raw)) return [];
  const ranges: ResultRange[] = [];
  for (const r of raw) {
    if (
      r &&
      typeof r === "object" &&
      typeof (r as { min?: unknown }).min === "number" &&
      typeof (r as { max?: unknown }).max === "number" &&
      typeof (r as { label?: unknown }).label === "string"
    ) {
      ranges.push({
        min: (r as { min: number }).min,
        max: (r as { max: number }).max,
        label: (r as { label: string }).label,
        description:
          typeof (r as { description?: unknown }).description === "string"
            ? (r as { description: string }).description
            : undefined,
        recommendation:
          typeof (r as { recommendation?: unknown }).recommendation === "string"
            ? (r as { recommendation: string }).recommendation
            : undefined,
      });
    }
  }
  return ranges;
}

export function parsesorular(raw: unknown): TestSoru[] {
  if (!Array.isArray(raw)) return [];
  const result: TestSoru[] = [];
  for (const s of raw) {
    if (
      s &&
      typeof s === "object" &&
      typeof (s as { id?: unknown }).id === "string" &&
      typeof (s as { text?: unknown }).text === "string" &&
      Array.isArray((s as { options?: unknown }).options)
    ) {
      const options: { value: number; label: string }[] = [];
      for (const o of (s as { options: unknown[] }).options) {
        if (
          o &&
          typeof o === "object" &&
          typeof (o as { value?: unknown }).value === "number" &&
          typeof (o as { label?: unknown }).label === "string"
        ) {
          options.push({
            value: (o as { value: number }).value,
            label: (o as { label: string }).label,
          });
        }
      }
      result.push({ id: (s as { id: string }).id, text: (s as { text: string }).text, options });
    }
  }
  return result;
}

export function hesaplaSkoru(
  answers: Record<string, number>,
  logic: ScoringLogic
): number {
  const values = Object.values(answers);
  if (values.length === 0) return 0;
  const toplam = values.reduce((a, b) => a + b, 0);
  if (logic.type === "average") {
    return Math.round((toplam / values.length) * 10) / 10;
  }
  return toplam;
}

export function sonucBul(score: number, ranges: ResultRange[]): ResultRange | null {
  return ranges.find((r) => score >= r.min && score <= r.max) ?? null;
}

export function sanitizeText(text: string) {
  return text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\b(?:AIza[\w-]{20,}|sb_(?:secret|publishable)_[\w-]+|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/g, "[REDACTED]")
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[EMAIL REDACTED]")
    .replace(/((?:password|passwd|api[_-]?key|secret|auth[_-]?token|access[_-]?token)\s*[=:]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;]+)/gi, "$1[REDACTED]");
}
export function boundedText(text: string, limit: number) {
  const clean = sanitizeText(text);
  return clean.length > limit ? `${clean.slice(0, limit)}\n[TRUNCATED: konteks tambahan tidak dikirim]` : clean;
}
export function sanitizeData(value: unknown): unknown {
  if (typeof value === "string") return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeData);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [sanitizeText(key), sanitizeData(child)]));
  return value;
}

export function privacySafePromptTelemetry(row: Record<string, unknown>): Record<string, unknown> {
  const safe = { ...row };
  const user_question = safe.user_question;
  const response_text = safe.response_text;
  delete safe.user_question;
  delete safe.response_text;
  delete safe.error_detail;
  if (typeof user_question === "string") safe.question_length = user_question.length;
  if (typeof response_text === "string") safe.response_length = response_text.length;
  return safe;
}

export function sanitizeClientDiagnostic(value: string, maxLength: number): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [redacted]")
    .replace(/[?&](password|token|secret|key)=[^&\s]+/gi, (_match, key: string) => `&${key}=[redacted]`)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn redacted]")
    .replace(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, "[phone redacted]")
    .slice(0, maxLength);
}

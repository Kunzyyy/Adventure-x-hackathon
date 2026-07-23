// llm/log.ts — privacy-preserving logger. Redacts anything that looks like a
// secret and strips long payloads so a stray console.log can never leak a full
// resume, answer, or API key.

const SECRET = /sk-[A-Za-z0-9_-]{8,}/g;
const ENV_SECRET = /AI_API_KEY\s*=\s*[^\n]*/gi;

export function redactLog(s: string): void {
  let out = s.replace(SECRET, "[REDACTED]").replace(ENV_SECRET, "AI_API_KEY=[REDACTED]");
  if (out.length > 500) out = out.slice(0, 487) + "…[truncated]";
  // eslint-disable-next-line no-console
  console.log(out);
}
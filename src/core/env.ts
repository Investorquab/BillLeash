/** Load .env from the current directory if present (Node 22 built-in; no deps). */
try {
  (process as unknown as { loadEnvFile: (p?: string) => void }).loadEnvFile(".env");
} catch {
  /* no .env file — env vars may be set another way */
}
export {};

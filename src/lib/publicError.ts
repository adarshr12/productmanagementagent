// Turns an internal failure into a message that's safe and useful to show a
// visitor. The raw error (Gemini status codes, Supabase messages, stack traces)
// stays in the server logs only — end users get plain language and a next step.
export function publicErrorMessage(err: unknown, fallback: string): string {
  const status = (err as { status?: number } | null)?.status;
  // Gemini still rate-limited / overloaded after retries and the fallback model.
  if (status === 429 || status === 500 || status === 503) {
    return "Our AI mentor is getting a lot of requests right now. Please try again in a minute.";
  }
  return fallback;
}

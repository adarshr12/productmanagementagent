# Prompts

Plain-text system prompts live here so you can edit the AI's behaviour **without
touching code**. Change the wording, save the file, redeploy — that's it.

## Files

- `roadmap-system.txt` — the instructions sent to Groq when generating a roadmap.
  It tells the model who it's helping, how to use the retrieved context, and (very
  important) to return its answer as strict JSON so the app can split it into
  trackable steps.

## Editing tips

- Keep the **OUTPUT FORMAT** section intact. The app relies on the model returning
  a JSON object with `title`, `overview`, and `steps`. If you break that shape,
  results pages may fail to render.
- After any change, run the evals (`npm run eval`) to sanity-check output quality
  before deploying. See `/evals`.

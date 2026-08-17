# Evals — sanity-check output quality by hand

Before you ship any change that could affect roadmap quality — a new system
prompt, a different model, or newly uploaded documents — run these and eyeball the
results.

## How to run

1. Make sure the app is running and your environment variables are set:
   - locally: `npm run dev` (roadmap generation needs Supabase + Voyage + Groq keys)
   - or point at your live site.
2. Run:
   ```bash
   npm run eval
   # or against the live site:
   EVAL_BASE_URL=https://start.yourdomain.com npm run eval
   ```

It prints each sample applicant's generated roadmap (title, overview, steps, link).

> Each run creates real database rows, because it exercises the full pipeline.

## What to look for (quality checklist)

For each of the 3 cases, check:

- [ ] **Targeted** — does it clearly address the person's *target role* (BA / PM /
      Product Analyst), not generic advice?
- [ ] **Gap-aware** — does an early step tackle their stated *biggest skill gap*?
- [ ] **Right level** — is the difficulty/pace sensible for their experience level
      (a fresher vs. someone with 5 years)?
- [ ] **Concrete** — are steps specific and finishable (days to a couple of weeks),
      not vague ("learn product management")?
- [ ] **Grounded** — does it lean on your uploaded resources where relevant, and
      avoid inventing fake courses, certifications, or numbers?
- [ ] **Right size** — 5 to 8 steps, each with a clear "done" signal.
- [ ] **India-aware** — where relevant, does it fit the Indian job market without
      forcing it?

## The cases

- `01-fresher-to-business-analyst.json`
- `02-support-to-product-manager.json`
- `03-analyst-to-product-analyst.json`

Add your own cases by dropping more `.json` files in `cases/` with the same shape.

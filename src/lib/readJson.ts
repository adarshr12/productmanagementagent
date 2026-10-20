// Browser-safe. Parses an API response as JSON, but survives the plain-text
// error pages Vercel returns when a function times out or crashes (e.g.
// "An error occurred with your deployment…"), which would otherwise surface
// to the user as a cryptic "Unexpected token 'A' … is not valid JSON".
export async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 504 || /TIMEOUT/i.test(text)) {
      throw new Error("This took longer than expected. Please try again — it usually works on the next attempt.");
    }
    throw new Error("Something went wrong on our side. Please try again in a minute.");
  }
}

import { promises as fs } from "fs";
import path from "path";

// Loads a plain-text prompt from the /prompts folder at runtime, so you can edit
// prompts without changing code. (next.config.js includes /prompts in the deploy.)
export async function loadPrompt(fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), "prompts", fileName);
  return fs.readFile(filePath, "utf-8");
}

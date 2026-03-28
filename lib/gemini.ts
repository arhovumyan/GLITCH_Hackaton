import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const modelLite = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429") || msg.includes("quota"))
    return "Gemini API rate limit exceeded. Please wait a minute and try again, or check your API key billing at https://ai.google.dev.";
  if (msg.includes("401") || msg.includes("403") || msg.includes("API_KEY"))
    return "Gemini API key is invalid or not configured. Add a valid GEMINI_API_KEY to .env.local.";
  return `Explanation unavailable: ${msg}`;
}

export async function generateExplanation(prompt: string, { lite = false } = {}): Promise<string> {
  const t0 = performance.now();
  const m = lite ? modelLite : model;
  const tag = lite ? "generateExplanation[lite]" : "generateExplanation";
  console.log(`[gemini] ${tag} — prompt length: ${prompt.length}`);
  try {
    const result = await m.generateContent(prompt);
    const text = result.response.text();
    console.log(`[gemini] ${tag} — done in ${Math.round(performance.now() - t0)}ms`);
    return text;
  } catch (err) {
    console.error(`[gemini] ${tag} failed:`, err);
    return friendlyError(err);
  }
}

export async function* generateExplanationStream(
  prompt: string,
  { lite = false } = {}
): AsyncGenerator<string> {
  const t0 = performance.now();
  const m = lite ? modelLite : model;
  const tag = lite ? "generateExplanationStream[lite]" : "generateExplanationStream";
  console.log(`[gemini] ${tag} — prompt length: ${prompt.length}`);
  try {
    const result = await m.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
    console.log(`[gemini] ${tag} — done in ${Math.round(performance.now() - t0)}ms`);
  } catch (err) {
    console.error(`[gemini] ${tag} failed:`, err);
    yield friendlyError(err);
  }
}

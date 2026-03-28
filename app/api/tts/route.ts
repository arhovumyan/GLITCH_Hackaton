import { NextRequest } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_TTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { text } = body;
  if (!text || text.length < 5) {
    return new Response("Text too short", { status: 400 });
  }

  // Cap at ~3000 chars to keep audio response reasonable
  const truncated = text.slice(0, 3000);

  try {
    const res = await fetch(GEMINI_TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Read the following explanation aloud in a clear, friendly, conversational tone. Do not add any extra commentary — just read the content naturally:\n\n${truncated}` }],
          },
        ],
        generationConfig: {
          response_modalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[tts] Gemini TTS failed:", res.status, err);
      return new Response(JSON.stringify({ error: "TTS generation failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const audioPart = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith("audio/")
    );

    if (!audioPart?.inlineData) {
      console.error("[tts] No audio in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No audio generated" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const audioBuffer = Buffer.from(audioPart.inlineData.data, "base64");
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": audioPart.inlineData.mimeType,
        "Content-Length": String(audioBuffer.length),
      },
    });
  } catch (err) {
    console.error("[tts] Error:", err);
    return new Response(JSON.stringify({ error: "TTS request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

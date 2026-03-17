import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiGenerateSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  // Auth guard
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Validate body
  const body = await req.json();
  const parsed = aiGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { topic, keywords, tone, length } = parsed.data;
  const wordTarget = { short: 400, medium: 800, long: 1400 }[length];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Return a stub when no API key is configured (dev mode)
    return NextResponse.json({
      title: `${topic}: A Complete Guide`,
      content: `# ${topic}: A Complete Guide\n\n## Introduction\n\nThis is a placeholder article about **${topic}**. Configure your OpenAI API key to generate real content.\n\n## Key Points\n\n- ${topic} is an important marketing topic\n- Understanding ${keywords ?? "core concepts"} helps drive results\n- Consistent execution leads to growth\n\n## Conclusion\n\nImplement these strategies today to see real results.`,
      excerpt: `A comprehensive guide to ${topic} covering everything you need to know.`,
    });
  }

  const systemPrompt = `You are an expert content marketer. Write a high-quality, ${tone} blog post of approximately ${wordTarget} words.
Return a JSON object with keys: title (string), content (markdown string), excerpt (1-2 sentence string).
Do not wrap the JSON in markdown code fences.`;

  const userPrompt = `Topic: ${topic}
${keywords ? `Keywords to include: ${keywords}` : ""}
Tone: ${tone}
Target length: ~${wordTarget} words`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message ?? "OpenAI error" }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to generate content";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

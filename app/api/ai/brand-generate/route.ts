import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { topic, keywords, tone, length, brand_context } = body;

  if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  const wordTarget = { short: 400, medium: 800, long: 1400 }[length as string] ?? 800;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      title: `${topic}: Complete Guide`,
      content: `# ${topic}\n\n## Introduction\n\nThis is a sample blog post for **${brand_context.split("\n")[0].replace("Brand: ", "")}**.\n\nConfigure your OpenAI API key to generate real content.\n\n## Key Benefits\n\n- High quality materials\n- Professional installation\n- Long-lasting results\n\n## Conclusion\n\nContact us today to learn more.`,
      excerpt: `A comprehensive guide about ${topic}.`,
      meta_description: `Learn everything about ${topic}. Expert insights and tips.`,
    });
  }

  const systemPrompt = `You are an expert content writer and SEO specialist.

${brand_context}

Write a high-quality, ${tone} blog post of approximately ${wordTarget} words.
- Use the brand's voice and tone consistently
- Naturally incorporate the provided keywords
- Structure with proper headings (H2, H3)
- Include practical value for the target audience
- End with a subtle call-to-action

Return ONLY a JSON object with these keys:
- title (string): SEO-optimized blog title
- content (string): Full blog post in markdown format  
- excerpt (string): 1-2 sentence summary
- meta_description (string): SEO meta description under 160 characters

Do NOT wrap the JSON in markdown code fences.`;

  const userPrompt = `Write a blog post about: ${topic}
Keywords to include: ${keywords}
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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message ?? "OpenAI error" }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.choices[0]?.message?.content ?? "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to generate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

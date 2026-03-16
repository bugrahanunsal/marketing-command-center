import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error_description");

  if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);

  if (code) {
    const sb = createClient();
    const { error: ex } = await sb.auth.exchangeCodeForSession(code);
    if (!ex) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(ex.message)}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}

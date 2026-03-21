import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/signup", "/reset-password"];
const PROTECTED = ["/dashboard", "/tasks", "/seo", "/backlinks", "/backlink-upload", "/calendar", "/blog", "/blog-reports", "/ads-reports", "/settings", "/analytics"];

export async function middleware(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (!user && isProtected) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STORES = [
  {
    key: "grs",
    name: "The Glass Railing Store",
    url: process.env.SHOPIFY_STORE_URL!,
    token: process.env.SHOPIFY_ACCESS_TOKEN!,
  },
  {
    key: "rf",
    name: "RF Transparent",
    url: process.env.SHOPIFY_RF_STORE_URL!,
    token: process.env.SHOPIFY_RF_ACCESS_TOKEN!,
  },
  {
    key: "bc",
    name: "BC Transparent",
    url: process.env.SHOPIFY_BC_STORE_URL!,
    token: process.env.SHOPIFY_BC_ACCESS_TOKEN!,
  },
];

async function fetchShopifyOrders(storeUrl: string, token: string, createdAtMin?: string) {
  const url = new URL(`https://${storeUrl}/admin/api/2024-01/orders.json`);
  url.searchParams.set("status", "any");
  url.searchParams.set("limit", "250");
  if (createdAtMin) url.searchParams.set("created_at_min", createdAtMin);
  const res = await fetch(url.toString(), {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  const data = await res.json();
  return data.orders || [];
}

export async function POST(req: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const results: Record<string, unknown> = {};
  for (const store of STORES) {
    try {
      const { data: storeRecord } = await sb.from("shopify_stores").select("id").eq("store_url", store.url.replace("https://", "")).single();
      if (!storeRecord) { results[store.key] = { error: "Store not found in DB" }; continue; }
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const orders = await fetchShopifyOrders(store.url.replace("https://", ""), store.token, thirtyDaysAgo.toISOString());
      if (orders.length > 0) {
        const orderRows = orders.map((o: Record<string, unknown>) => ({
          store_id: storeRecord.id,
          shopify_id: o.id,
          order_number: o.name,
          email: o.email || null,
          total_price: parseFloat((o.total_price as string) || "0"),
          subtotal_price: parseFloat((o.subtotal_price as string) || "0"),
          total_tax: parseFloat((o.total_tax as string) || "0"),
          currency: o.currency || "CAD",
          financial_status: o.financial_status || null,
          fulfillment_status: o.fulfillment_status || null,
          country_code: (o.shipping_address as Record<string, string>)?.country_code || null,
          province_code: (o.shipping_address as Record<string, string>)?.province_code || null,
          city: (o.shipping_address as Record<string, string>)?.city || null,
          source_name: o.source_name || null,
          tags: o.tags || null,
          line_items_count: ((o.line_items as unknown[]) || []).length,
          created_at: o.created_at,
          updated_at: o.updated_at,
          synced_at: new Date().toISOString(),
        }));
        await sb.from("shopify_orders").upsert(orderRows, { onConflict: "store_id,shopify_id" });
      }
      results[store.key] = { synced: orders.length };
    } catch (e) {
      results[store.key] = { error: e instanceof Error ? e.message : "Unknown error" };
    }
  }
  return NextResponse.json({ success: true, results });
}

export async function GET(req: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const { data: stores } = await sb.from("shopify_stores").select("*").eq("is_active", true);
  const { data: orders, error } = await sb.from("shopify_orders").select("*, shopify_stores(name, currency)").gte("created_at", fromDate.toISOString()).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const storeStats: Record<string, { name: string; total_orders: number; total_revenue: number; avg_order_value: number; currency: string; }> = {};
  for (const order of (orders || [])) {
    const storeName = (order.shopify_stores as { name: string; currency: string })?.name || "Unknown";
    const currency = (order.shopify_stores as { name: string; currency: string })?.currency || "CAD";
    if (!storeStats[storeName]) storeStats[storeName] = { name: storeName, total_orders: 0, total_revenue: 0, avg_order_value: 0, currency };
    storeStats[storeName].total_orders++;
    storeStats[storeName].total_revenue += Number(order.total_price);
  }
  for (const key of Object.keys(storeStats)) {
    storeStats[key].avg_order_value = storeStats[key].total_orders > 0 ? storeStats[key].total_revenue / storeStats[key].total_orders : 0;
  }
  const revenueByDay: Record<string, number> = {};
  for (const order of (orders || [])) {
    const day = new Date(order.created_at).toISOString().split("T")[0];
    revenueByDay[day] = (revenueByDay[day] || 0) + Number(order.total_price);
  }
  const revenueByCountry: Record<string, number> = {};
  for (const order of (orders || [])) {
    const country = order.country_code || "Unknown";
    revenueByCountry[country] = (revenueByCountry[country] || 0) + Number(order.total_price);
  }
  const revenueByProvince: Record<string, number> = {};
  for (const order of (orders || [])) {
    const province = order.province_code || "Unknown";
    revenueByProvince[province] = (revenueByProvince[province] || 0) + Number(order.total_price);
  }
  return NextResponse.json({
    stores: Object.values(storeStats),
    revenueByDay: Object.entries(revenueByDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue })),
    revenueByCountry: Object.entries(revenueByCountry).sort(([, a], [, b]) => b - a).map(([country, revenue]) => ({ country, revenue })),
    revenueByProvince: Object.entries(revenueByProvince).sort(([, a], [, b]) => b - a).map(([province, revenue]) => ({ province, revenue })),
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.reduce((s, o) => s + Number(o.total_price), 0) || 0,
    recentOrders: orders?.slice(0, 20) || [],
  });
}

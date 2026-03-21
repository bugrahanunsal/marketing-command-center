"use client";
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, ShoppingBag, DollarSign, RefreshCw, Globe, MapPin, Store } from "lucide-react";
import { Button, StatCard, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StoreStats { name: string; total_orders: number; total_revenue: number; avg_order_value: number; currency: string; }
interface DayRevenue { date: string; revenue: number; }
interface CountryRevenue { country: string; revenue: number; }
interface ProvinceRevenue { province: string; revenue: number; }
interface AnalyticsData { stores: StoreStats[]; revenueByDay: DayRevenue[]; revenueByCountry: CountryRevenue[]; revenueByProvince: ProvinceRevenue[]; totalOrders: number; totalRevenue: number; recentOrders: Record<string, unknown>[]; }

const DAYS_OPTIONS = [7, 14, 30, 60, 90];
const COUNTRY_NAMES: Record<string, string> = { CA: "🇨🇦 Canada", US: "🇺🇸 United States", GB: "🇬🇧 United Kingdom", AU: "🇦🇺 Australia", FR: "🇫🇷 France", DE: "🇩🇪 Germany", Unknown: "🌍 Unknown" };
const STORE_COLORS: Record<string, string> = { "The Glass Railing Store": "bg-blue-500", "RF Transparent": "bg-green-500", "BC Transparent": "bg-purple-500" };

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"overview" | "geography" | "orders">("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shopify/analytics?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function syncData() {
    setSyncing(true);
    try { await fetch("/api/shopify/analytics", { method: "POST" }); await fetchData(); } finally { setSyncing(false); }
  }

  const maxRevenue = data?.revenueByDay ? Math.max(...data.revenueByDay.map(d => d.revenue), 1) : 1;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Shopify sales across all stores</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 bg-surface-1">
            {DAYS_OPTIONS.map(d => (
              <button key={d} onClick={() => setDays(d)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", days === d ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground")}>{d}d</button>
            ))}
          </div>
          <Button variant="outline" onClick={syncData} disabled={syncing}>
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner /></div>
      ) : !data ? (
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">No data. Click Sync to fetch from Shopify.</p>
          <Button className="mt-4" onClick={syncData} loading={syncing}>Sync Now</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Revenue" value={`$${data.totalRevenue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`} sub={`Last ${days} days`} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
            <StatCard label="Total Orders" value={data.totalOrders} sub="All orders" icon={<ShoppingBag className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
            <StatCard label="Avg Order Value" value={`$${data.totalOrders > 0 ? (data.totalRevenue / data.totalOrders).toFixed(0) : 0}`} sub="Per order" icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-amber-500/10 text-amber-500" />
            <StatCard label="Active Stores" value={data.stores.length} sub="Synced stores" icon={<Store className="h-4 w-4" />} iconColor="bg-purple-500/10 text-purple-500" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {data.stores.map(store => (
              <div key={store.name} className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full", STORE_COLORS[store.name] || "bg-brand")} />
                  <p className="text-sm font-semibold text-foreground truncate">{store.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-surface-2 p-2 text-center">
                    <p className="text-lg font-bold text-foreground">{store.total_orders}</p>
                    <p className="text-[10px] text-muted-foreground">Orders</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2 text-center">
                    <p className="text-lg font-bold text-green-600">${store.total_revenue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2 text-center">
                    <p className="text-lg font-bold text-foreground">${store.avg_order_value.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">AOV</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 rounded-xl border border-border bg-surface-1 p-1 w-fit">
            {(["overview", "geography", "orders"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors", activeTab === t ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>{t}</button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Over Time</h3>
              {data.revenueByDay.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No data yet. Click Sync.</p>
              ) : (
                <div className="space-y-1">
                  {data.revenueByDay.map(d => (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">{new Date(d.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</span>
                      <div className="flex-1 h-6 bg-surface-2 rounded overflow-hidden">
                        <div className="h-full bg-brand/70 rounded transition-all" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-20 text-right">${d.revenue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "geography" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Globe className="h-4 w-4" /> Revenue by Country</h3>
                <div className="space-y-2">
                  {data.revenueByCountry.slice(0, 10).map(c => (
                    <div key={c.country} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-36 shrink-0">{COUNTRY_NAMES[c.country] || `🌍 ${c.country}`}</span>
                      <div className="flex-1 h-5 bg-surface-2 rounded overflow-hidden">
                        <div className="h-full bg-green-500/60 rounded" style={{ width: `${(c.revenue / (data.revenueByCountry[0]?.revenue || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-20 text-right">${c.revenue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><MapPin className="h-4 w-4" /> Revenue by Province/State</h3>
                <div className="space-y-2">
                  {data.revenueByProvince.slice(0, 10).map(p => (
                    <div key={p.province} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-20 shrink-0">{p.province}</span>
                      <div className="flex-1 h-5 bg-surface-2 rounded overflow-hidden">
                        <div className="h-full bg-blue-500/60 rounded" style={{ width: `${(p.revenue / (data.revenueByProvince[0]?.revenue || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-20 text-right">${p.revenue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-border"><h3 className="text-sm font-semibold text-foreground">Recent Orders</h3></div>
              <table className="data-table">
                <thead><tr><th>Order</th><th>Store</th><th>Date</th><th>Country</th><th>Status</th><th>Revenue</th></tr></thead>
                <tbody>
                  {data.recentOrders.map((order: Record<string, unknown>) => (
                    <tr key={order.id as string}>
                      <td className="font-medium text-foreground">{order.order_number as string}</td>
                      <td className="text-xs text-muted-foreground">{(order.shopify_stores as { name: string })?.name || "—"}</td>
                      <td className="text-xs text-muted-foreground">{new Date(order.created_at as string).toLocaleDateString("en-CA")}</td>
                      <td className="text-xs text-muted-foreground">{COUNTRY_NAMES[order.country_code as string] || order.country_code as string || "—"}</td>
                      <td><span className={cn("badge text-xs capitalize", order.financial_status === "paid" ? "status-active" : "status-pending")}>{order.financial_status as string}</span></td>
                      <td className="font-medium text-green-600">${Number(order.total_price).toLocaleString("en-CA", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { Plus, Globe, Edit2, Trash2, Sparkles, Target, Users, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Input, Textarea, FormField, EmptyState, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import Link from "next/link";

interface BrandProfile {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  target_audience: string | null;
  brand_tone: string;
  brand_keywords: string[] | null;
  shopify_url: string | null;
  website_url: string | null;
  blog_count: number;
  is_active: boolean;
  created_at: string;
}

const TONES = [
  { value: "professional", label: "Professional — Formal, authoritative" },
  { value: "casual", label: "Casual — Friendly, conversational" },
  { value: "technical", label: "Technical — Detailed, expert-level" },
  { value: "inspirational", label: "Inspirational — Motivating, emotional" },
  { value: "educational", label: "Educational — Clear, informative" },
];

const EMPTY = {
  name: "", description: "", industry: "", target_audience: "",
  brand_tone: "professional", brand_keywords: "",
  shopify_url: "", website_url: "",
};

export default function BrandManager({
  initialBrands, userId, profile,
}: {
  initialBrands: BrandProfile[];
  userId: string;
  profile: Profile | null;
}) {
  const [brands, setBrands] = useState<BrandProfile[]>(initialBrands);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BrandProfile | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [isPending, start] = useTransition();
  const setF = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function openCreate() { setForm(EMPTY); setEditing(null); setShowModal(true); }
  function openEdit(b: BrandProfile) {
    setForm({
      name: b.name, description: b.description ?? "",
      industry: b.industry ?? "", target_audience: b.target_audience ?? "",
      brand_tone: b.brand_tone, brand_keywords: (b.brand_keywords ?? []).join(", "),
      shopify_url: b.shopify_url ?? "", website_url: b.website_url ?? "",
    });
    setEditing(b); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Brand name is required"); return; }
    start(async () => {
      try {
        const sb = createClient();
        const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const payload = {
          user_id: userId,
          name: form.name,
          slug,
          description: form.description || null,
          industry: form.industry || null,
          target_audience: form.target_audience || null,
          brand_tone: form.brand_tone,
          brand_keywords: form.brand_keywords ? form.brand_keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
          shopify_url: form.shopify_url || null,
          website_url: form.website_url || null,
        };
        if (editing) {
          const { error } = await sb.from("brand_profiles").update(payload).eq("id", editing.id);
          if (error) throw new Error(error.message);
          setBrands((p) => p.map((b) => b.id === editing.id ? { ...b, ...payload } : b));
          toast.success("Brand updated!");
        } else {
          const { data, error } = await sb.from("brand_profiles").insert(payload).select().single();
          if (error) throw new Error(error.message);
          setBrands((p) => [data, ...p]);
          toast.success("Brand created!");
        }
        setShowModal(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this brand?")) return;
    start(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.from("brand_profiles").delete().eq("id", id);
        if (error) throw new Error(error.message);
        setBrands((p) => p.filter((b) => b.id !== id));
        toast.success("Brand deleted!");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  const toneColors: Record<string, string> = {
    professional: "bg-blue-500/10 text-blue-600",
    casual: "bg-green-500/10 text-green-600",
    technical: "bg-purple-500/10 text-purple-600",
    inspirational: "bg-amber-500/10 text-amber-600",
    educational: "bg-cyan-500/10 text-cyan-600",
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Brand Profiles</h1>
          <p className="page-subtitle">Manage your website brands and AI voice settings</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-10 w-10" />}
          title="No brands yet"
          description="Add your first brand to start creating AI-powered content."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Brand</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <div key={brand.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{brand.name}</h3>
                  {brand.website_url && (
                    <a href={brand.website_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline flex items-center gap-1 mt-0.5">
                      <Globe className="h-3 w-3" /> {brand.website_url.replace(/https?:\/\//, "")}
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(brand)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(brand.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {brand.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{brand.description}</p>
              )}

              <div className="space-y-2">
                {brand.industry && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />
                    <span>{brand.industry}</span>
                  </div>
                )}
                {brand.target_audience && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{brand.target_audience}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={cn("badge text-xs", toneColors[brand.brand_tone] ?? "bg-surface-2 text-muted-foreground")}>
                    {brand.brand_tone}
                  </span>
                </div>
                {brand.brand_keywords && brand.brand_keywords.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {brand.brand_keywords.slice(0, 4).map((kw) => (
                        <span key={kw} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">{kw}</span>
                      ))}
                      {brand.brand_keywords.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{brand.brand_keywords.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-2 border-t border-border">
                <Link href={`/brands/${brand.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI Blog Studio
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Brand" : "Add Brand"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Brand Name" required>
              <Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. RF Transparent" />
            </FormField>
            <FormField label="Industry">
              <Input value={form.industry} onChange={(e) => setF("industry", e.target.value)} placeholder="e.g. Glass Railings & Balconies" />
            </FormField>
          </div>

          <FormField label="Brand Description">
            <Textarea value={form.description} onChange={(e) => setF("description", e.target.value)}
              placeholder="Describe your brand, products, and what makes you unique..." rows={3} />
          </FormField>

          <FormField label="Target Audience">
            <Input value={form.target_audience} onChange={(e) => setF("target_audience", e.target.value)}
              placeholder="e.g. Homeowners, contractors, architects in Canada" />
          </FormField>

          <FormField label="Brand Voice / Tone">
            <Select value={form.brand_tone} onChange={(e) => setF("brand_tone", e.target.value)}>
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormField>

          <FormField label="SEO Keywords" hint="Comma-separated — AI will use these in every blog post">
            <Input value={form.brand_keywords} onChange={(e) => setF("brand_keywords", e.target.value)}
              placeholder="glass railing, frameless balcony, exterior glass panels, Toronto" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Website URL">
              <Input value={form.website_url} onChange={(e) => setF("website_url", e.target.value)}
                placeholder="https://rftransparent.com" />
            </FormField>
            <FormField label="Shopify Store URL">
              <Input value={form.shopify_url} onChange={(e) => setF("shopify_url", e.target.value)}
                placeholder="https://yourstore.myshopify.com" />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>
              {editing ? "Save Changes" : "Create Brand"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

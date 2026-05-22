"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewShootForm() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: "",
    shootDate: today,
    location: "",
    category: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback(<K extends keyof typeof form>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value })), []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/shoots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }, [form, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-slate-700/50 bg-white/[0.03] backdrop-blur-sm rounded-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-100 tracking-wide">New shoot</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title" className="text-slate-300 text-xs uppercase tracking-wider">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. May 2026 Shoot – Paris Studio" required 
                className="bg-black/40 border-slate-700/60 text-slate-100 placeholder-slate-600 rounded-xl focus:border-emerald-500/40" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shootDate" className="text-slate-300 text-xs uppercase tracking-wider">Shoot date *</Label>
              <Input id="shootDate" type="date" value={form.shootDate}
                onChange={(e) => set("shootDate", e.target.value)} required 
                className="bg-black/40 border-slate-700/60 text-slate-100 rounded-xl focus:border-emerald-500/40" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location" className="text-slate-300 text-xs uppercase tracking-wider">Location (optional)</Label>
              <Input id="location" value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Studio, city…" 
                className="bg-black/40 border-slate-700/60 text-slate-100 placeholder-slate-600 rounded-xl focus:border-emerald-500/40" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category" className="text-slate-300 text-xs uppercase tracking-wider">Category / Content type (optional)</Label>
              <Input id="category" value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. OnlyFans, Promo, Adult…" 
                className="bg-black/40 border-slate-700/60 text-slate-100 placeholder-slate-600 rounded-xl focus:border-emerald-500/40" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes" className="text-slate-300 text-xs uppercase tracking-wider">Notes (optional)</Label>
              <Input id="notes" value={form.notes}
                onChange={(e) => set("notes", e.target.value)} 
                className="bg-black/40 border-slate-700/60 text-slate-100 placeholder-slate-600 rounded-xl focus:border-emerald-500/40" />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}
                disabled={loading}
                className="border-slate-700/60 bg-black/40 hover:bg-black/60 text-slate-200 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl">
                {loading ? "Creating…" : "Create shoot"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

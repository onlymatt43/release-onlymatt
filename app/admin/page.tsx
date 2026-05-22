export const dynamic = "force-dynamic";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import ShootCard from "@/components/admin/ShootCard";
import LogoutButton from "@/components/admin/LogoutButton";
import VelvetBackground from "@/components/VelvetBackground";
import type { Shoot } from "@/lib/types";

export default async function AdminPage() {
  const db = getDb();
  const result = await db.execute(`
    SELECT s.id, s.title, s.shoot_date, s.photographer, s.location, s.notes, s.created_at,
           COUNT(p.id) as contract_count
    FROM shoots s
    LEFT JOIN participations p ON p.shoot_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);

  const shoots = result.rows as unknown as Shoot[];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://release-onlymatt.vercel.app";

  return (
    <VelvetBackground>
      <div className="min-h-screen">
        <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm px-6 py-4 sticky top-0 z-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <h1 className="text-xl font-bold">
              <span className="text-gradient-emerald-cyan">Admin</span>
            </h1>
            <div className="flex gap-2">
              <Link href="/admin/contacts">
                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200">Contacts</Button>
              </Link>
              <Link href="/admin/shoots/new">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white">+ New shoot</Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl p-6">
          {shoots.length === 0 ? (
            <div className="rounded-lg border border-slate-800/50 border-dashed p-12 text-center bg-slate-950/30">
              <p className="text-slate-400">
                No shoots yet.{" "}
                <Link href="/admin/shoots/new" className="underline text-emerald-400 hover:text-emerald-300">
                  Create one.
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shoots.map((shoot) => (
                <ShootCard key={shoot.id} shoot={shoot} baseUrl={baseUrl} />
              ))}
            </div>
          )}
        </main>
      </div>
    </VelvetBackground>
  );
}

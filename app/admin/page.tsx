import Link from "next/link";
import { getDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import ShootCard from "@/components/admin/ShootCard";
import LogoutButton from "@/components/admin/LogoutButton";
import type { Shoot } from "@/lib/types";

export default async function AdminPage() {
  const db = getDb();
  const result = await db.execute(`
    SELECT s.id, s.title, s.shoot_date, s.photographer, s.location, s.notes, s.created_at,
           COUNT(c.id) as contract_count
    FROM shoots s
    LEFT JOIN contracts c ON c.shoot_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);

  const shoots = result.rows as unknown as Shoot[];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://release-onlymatt.vercel.app";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">Shoots</h1>
          <div className="flex gap-2">
            <Link href="/admin/shoots/new">
              <Button size="sm">+ Nouveau shoot</Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        {shoots.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucun shoot pour l&apos;instant.{" "}
              <Link href="/admin/shoots/new" className="underline">
                Créez-en un.
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
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface Params { params: Promise<{ shootId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { shootId } = await params;
  try {
    const db = getDb();
    const [shootResult, contractsResult] = await Promise.all([
      db.execute({ sql: "SELECT * FROM shoots WHERE id = ?", args: [shootId] }),
      db.execute({
        sql: `SELECT id, full_name, email, phone, submitted_at,
                     consent_recording, consent_publication, consent_adult
              FROM contracts WHERE shoot_id = ? ORDER BY submitted_at DESC`,
        args: [shootId],
      }),
    ]);

    if (shootResult.rows.length === 0) {
      return NextResponse.json({ error: "Shoot introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      shoot: shootResult.rows[0],
      contracts: contractsResult.rows,
    });
  } catch (err) {
    console.error("[admin/shoots/:id GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { shootId } = await params;
  try {
    const db = getDb();
    await db.execute({ sql: "DELETE FROM shoots WHERE id = ?", args: [shootId] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/shoots/:id DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

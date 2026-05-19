import { getDb } from "@/lib/db";
import ConsentForm from "@/components/ConsentForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ shootId: string }>;
}

export default async function ConsentPage({ params }: PageProps) {
  const { shootId } = await params;

  let shootTitle: string | undefined;
  let shootDate: string | undefined;
  try {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT title, shoot_date FROM shoots WHERE id = ? LIMIT 1",
      args: [shootId],
    });
    if (res.rows[0]) {
      shootTitle = res.rows[0].title as string;
      shootDate = res.rows[0].shoot_date as string;
    }
  } catch {
    // non-blocking – form still works without shoot info
  }

  return <ConsentForm shootId={shootId} shootTitle={shootTitle} shootDate={shootDate} />;
}

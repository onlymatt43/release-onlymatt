import { getDb } from "@/lib/db";
import ConsentForm from "@/components/ConsentForm";
import VelvetBackground from "@/components/VelvetBackground";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ shootId: string }>;
}

export default async function ConsentPage({ params }: PageProps) {
  const { shootId } = await params;

  let shootTitle: string | undefined;
  let shootDate: string | undefined;
  let shootCategory: string | undefined;
  try {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT title, shoot_date, category FROM shoots WHERE id = ? LIMIT 1",
      args: [shootId],
    });
    if (res.rows[0]) {
      shootTitle = res.rows[0].title as string;
      shootDate = res.rows[0].shoot_date as string;
      shootCategory = (res.rows[0].category as string | null) ?? undefined;
    }
  } catch {
    // non-blocking – form still works without shoot info
  }

  // Fallback: si pas de shoot trouvé, afficher le shootId comme titre (ex: username créateur)
  if (!shootTitle) {
    shootTitle = `@${shootId}`;
  }

  return (
    <VelvetBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Elegant header with OnlyCard branding */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1 className="text-2xl font-extralight uppercase tracking-[0.2em] mb-2">
            <span className="text-gradient-emerald-cyan">OnlyMatt</span>
          </h1>
          <div className="separator-velvet mx-auto mb-3" />
          <p className="text-slate-300 text-xs uppercase tracking-[0.25em]">Model Release</p>
        </div>

        {/* Consent Form */}
        <ConsentForm 
          shootId={shootId} 
          shootTitle={shootTitle} 
          shootDate={shootDate} 
          shootCategory={shootCategory} 
        />
      </div>
    </VelvetBackground>
  );
}

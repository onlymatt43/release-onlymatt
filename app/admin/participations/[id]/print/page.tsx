export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getR2Client, R2_BUCKET } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import PrintButton from "@/components/admin/PrintButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function presign(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await getSignedUrl(
      getR2Client(),
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
  } catch {
    return null;
  }
}

const DOC_LABELS: Record<string, string> = {
  passport: "Passeport",
  drivers_license: "Permis de conduire",
  id_card: "Carte d'identité",
};

function Check({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid #333",
        borderRadius: 3,
        marginRight: 8,
        verticalAlign: "middle",
        background: ok ? "#111" : "#fff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "13px",
        fontSize: 12,
      }}
    >
      {ok ? "✓" : ""}
    </span>
  );
}

export default async function PrintParticipationPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();

  const result = await db.execute({
    sql: `SELECT
            p.id AS p_id, p.category AS p_category, p.signature_data,
            p.consent_recording, p.consent_publication, p.consent_adult,
            p.ip_address, p.signed_at,
            c.legal_name, c.stage_name, c.main_url, c.birth_date,
            c.email, c.phone, c.address, c.doc_type,
            c.recto_id_key, c.verso_id_key, c.selfie_key,
            s.title AS shoot_title, s.shoot_date, s.photographer,
            s.location AS shoot_location, s.category AS shoot_category
          FROM participations p
          JOIN contacts c ON c.id = p.contact_id
          JOIN shoots s ON s.id = p.shoot_id
          WHERE p.id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) notFound();

  const row = result.rows[0] as Record<string, unknown>;

  const [rectoUrl, versoUrl, selfieUrl] = await Promise.all([
    presign(row.recto_id_key as string | null),
    presign(row.verso_id_key as string | null),
    presign(row.selfie_key as string | null),
  ]);

  const signedAt = row.signed_at
    ? new Date(row.signed_at as string).toLocaleString("fr-CA", { timeZone: "America/Toronto" })
    : "—";

  const birthDate = row.birth_date
    ? new Date(row.birth_date as string).toLocaleDateString("fr-CA")
    : "—";

  const shootDate = row.shoot_date
    ? new Date(row.shoot_date as string).toLocaleDateString("fr-CA")
    : "—";

  const docLabel = row.doc_type
    ? (DOC_LABELS[row.doc_type as string] ?? (row.doc_type as string))
    : "Non spécifié";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
        }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; }
        .container { max-width: 750px; margin: 0 auto; padding: 32px 40px; }
        .header { border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666; }
        .title { font-size: 22px; font-weight: 700; margin: 4px 0 0; }
        .section { margin-bottom: 24px; }
        .section-title {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.5px; color: #666; margin-bottom: 10px;
          border-bottom: 1px solid #ddd; padding-bottom: 4px;
        }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
        .field label { font-size: 10px; color: #888; display: block; margin-bottom: 2px; }
        .field span { font-weight: 500; font-size: 13px; }
        .consent-item { margin-bottom: 8px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
        .sig-box {
          border: 1px solid #ccc; border-radius: 6px; padding: 8px;
          background: #fafafa; display: inline-block;
        }
        .sig-box img { display: block; max-height: 120px; max-width: 400px; }
        .photos { display: flex; gap: 16px; flex-wrap: wrap; }
        .photo-item label { font-size: 10px; color: #888; display: block; margin-bottom: 4px; }
        .photo-item img {
          width: 180px; height: 120px; object-fit: cover;
          border: 1px solid #ccc; border-radius: 4px; display: block;
        }
        .footer {
          margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px;
          font-size: 10px; color: #999; display: flex; justify-content: space-between;
        }
        .print-btn-bar {
          display: flex; justify-content: flex-end;
          padding: 16px 40px 0; gap: 12px;
        }
      `}</style>

      <div className="print:hidden print-btn-bar no-print">
        <a
          href=".."
          style={{
            fontSize: 13,
            color: "#555",
            textDecoration: "none",
            padding: "8px 16px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          ← Retour
        </a>
        <PrintButton />
      </div>

      <div className="container">
        {/* En-tête */}
        <div className="header">
          <div className="logo">OnlyMatt — Formulaire de consentement</div>
          <div className="title">Release de modèle / Model Release</div>
        </div>

        {/* Shoot */}
        <div className="section">
          <div className="section-title">Shooting</div>
          <div className="grid2">
            <div className="field"><label>Titre</label><span>{row.shoot_title as string}</span></div>
            <div className="field"><label>Date</label><span>{shootDate}</span></div>
            <div className="field"><label>Photographe</label><span>{row.photographer as string}</span></div>
            {row.shoot_location && (
              <div className="field"><label>Lieu</label><span>{row.shoot_location as string}</span></div>
            )}
            {row.shoot_category && (
              <div className="field"><label>Catégorie</label><span>{row.shoot_category as string}</span></div>
            )}
          </div>
        </div>

        {/* Modèle */}
        <div className="section">
          <div className="section-title">Modèle</div>
          <div className="grid2">
            <div className="field"><label>Nom légal</label><span>{row.legal_name as string}</span></div>
            <div className="field"><label>Nom de scène</label><span>{row.stage_name as string}</span></div>
            <div className="field"><label>Date de naissance</label><span>{birthDate}</span></div>
            <div className="field"><label>Email</label><span>{row.email as string}</span></div>
            {row.phone && <div className="field"><label>Téléphone</label><span>{row.phone as string}</span></div>}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Adresse</label>
              <span>{row.address as string}</span>
            </div>
            {row.main_url && (
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Profil principal</label>
                <span>{row.main_url as string}</span>
              </div>
            )}
          </div>
        </div>

        {/* Consentements */}
        <div className="section">
          <div className="section-title">Consentements</div>
          <div className="consent-item">
            <Check ok={Boolean(row.consent_recording)} />
            <span>Consentement à l&apos;enregistrement audio et vidéo</span>
          </div>
          <div className="consent-item">
            <Check ok={Boolean(row.consent_publication)} />
            <span>Consentement à la publication et distribution du contenu</span>
          </div>
          <div className="consent-item">
            <Check ok={Boolean(row.consent_adult)} />
            <span>Je déclare être majeur(e) et consentir librement à cette séance</span>
          </div>
        </div>

        {/* Signature */}
        <div className="section">
          <div className="section-title">Signature électronique</div>
          {row.signature_data ? (
            <div className="sig-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.signature_data as string} alt="Signature" />
            </div>
          ) : (
            <p style={{ color: "#999" }}>Signature non disponible</p>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
            <strong>Signé le :</strong> {signedAt}
            {row.ip_address && (
              <span style={{ marginLeft: 24 }}>
                <strong>IP :</strong> {row.ip_address as string}
              </span>
            )}
          </div>
        </div>

        {/* Pièces d'identité */}
        {(rectoUrl || versoUrl || selfieUrl) && (
          <div className="section">
            <div className="section-title">
              Pièces d&apos;identité — {docLabel}
            </div>
            <div className="photos">
              {rectoUrl && (
                <div className="photo-item">
                  <label>Recto</label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rectoUrl} alt="ID recto" />
                </div>
              )}
              {versoUrl && (
                <div className="photo-item">
                  <label>Verso</label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={versoUrl} alt="ID verso" />
                </div>
              )}
              {selfieUrl && (
                <div className="photo-item">
                  <label>Selfie avec pièce</label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieUrl} alt="Selfie" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div className="footer">
          <span>Ref. participation: {row.p_id as string}</span>
          <span>Document généré le {new Date().toLocaleDateString("fr-CA")}</span>
        </div>
      </div>
    </>
  );
}

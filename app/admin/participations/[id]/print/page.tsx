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

  const raw = result.rows[0] as Record<string, unknown>;

  // Extract typed values once so JSX conditionals work without 'unknown' errors
  const participationId  = raw.p_id as string;
  const signatureData    = raw.signature_data as string | null;
  const consentRecording = Boolean(raw.consent_recording);
  const consentPub       = Boolean(raw.consent_publication);
  const consentAdult     = Boolean(raw.consent_adult);
  const ipAddress        = raw.ip_address as string | null;

  const legalName   = raw.legal_name as string;
  const stageName   = raw.stage_name as string;
  const mainUrl     = raw.main_url as string | null;
  const email       = raw.email as string;
  const phone       = raw.phone as string | null;
  const address     = raw.address as string;
  const docType     = raw.doc_type as string | null;

  const shootTitle    = raw.shoot_title as string;
  const shootLocation = raw.shoot_location as string | null;
  const shootCategory = raw.shoot_category as string | null;

  const [rectoUrl, versoUrl, selfieUrl] = await Promise.all([
    presign(raw.recto_id_key as string | null),
    presign(raw.verso_id_key as string | null),
    presign(raw.selfie_key as string | null),
  ]);

  const signedAt = raw.signed_at
    ? new Date(raw.signed_at as string).toLocaleString("fr-CA", { timeZone: "America/Toronto" })
    : "—";

  const birthDate = raw.birth_date
    ? new Date(raw.birth_date as string).toLocaleDateString("fr-CA")
    : "—";

  const shootDate = raw.shoot_date
    ? new Date(raw.shoot_date as string).toLocaleDateString("fr-CA")
    : "—";

  const docLabel = docType ? (DOC_LABELS[docType] ?? docType) : "Non spécifié";

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
            <div className="field"><label>Titre</label><span>{shootTitle}</span></div>
            <div className="field"><label>Date</label><span>{shootDate}</span></div>
            <div className="field"><label>Producteur</label><span>OnlyMatt</span></div>
            {shootLocation && (
              <div className="field"><label>Lieu</label><span>{shootLocation}</span></div>
            )}
            {shootCategory && (
              <div className="field"><label>Catégorie</label><span>{shootCategory}</span></div>
            )}
          </div>
        </div>

        {/* Modèle */}
        <div className="section">
          <div className="section-title">Modèle</div>
          <div className="grid2">
            <div className="field"><label>Nom légal</label><span>{legalName}</span></div>
            <div className="field"><label>Nom de scène</label><span>{stageName}</span></div>
            <div className="field"><label>Date de naissance</label><span>{birthDate}</span></div>
            <div className="field"><label>Email</label><span>{email}</span></div>
            {phone && <div className="field"><label>Téléphone</label><span>{phone}</span></div>}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Adresse</label>
              <span>{address}</span>
            </div>
            {mainUrl && (
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Profil principal</label>
                <span>{mainUrl}</span>
              </div>
            )}
          </div>
        </div>

        {/* Texte du contrat */}
        <div className="section">
          <div className="section-title">Contrat de cession de droits à l&apos;image et consentement éclairé</div>
          <div style={{ fontSize: 11, color: "#333", lineHeight: 1.6 }}>
            <p>En signant ce formulaire, le/la soussigné(e) (ci-après « le Modèle ») autorise irrévocablement le photographe/producteur (ci-après « le Producteur ») et ses ayants droit, cessionnaires et licenciés à utiliser, reproduire, modifier, distribuer, publier et concéder sous licence les œuvres photographiques et audiovisuelles réalisées lors de la séance visée par le présent document.</p>
            <p style={{ marginTop: 8 }}>Cette autorisation porte notamment sur l&apos;exploitation commerciale et la diffusion sur toute plateforme de contenu numérique, de réseaux sociaux ou de plateformes pour adultes (incluant sans s&apos;y limiter OnlyFans, Fansly, Faphouse) ainsi que sur tout autre support numérique ou physique, présent ou futur, sans restriction géographique ni temporelle. Le Modèle reconnaît que cette cession est consentie à titre définitif et n&apos;ouvre droit à aucune rémunération ultérieure, redevance (royalties) ou droit de regard sur l&apos;utilisation du matériel.</p>
            <p style={{ marginTop: 8, fontWeight: 600 }}>Le Modèle certifie sous peine de parjure :</p>
            <ul style={{ marginTop: 4, paddingLeft: 20, lineHeight: 1.7 }}>
              <li>Être âgé(e) d&apos;au moins 18 ans à la date de la séance et avoir la pleine capacité juridique.</li>
              <li>Que les pièces d&apos;identité fournies sont authentiques, valides et le/la représentent fidèlement.</li>
              <li>Agir librement, de manière éclairée, sans contrainte, menace ni état altéré par une quelconque substance.</li>
              <li>Avoir lu, compris et accepté l&apos;intégralité du présent contrat avant d&apos;apposer sa signature électronique.</li>
            </ul>
            <p style={{ marginTop: 8 }}>Conformément aux exigences légales internationales applicables à la production de contenu pour adultes (notamment les normes de type 18 U.S.C. § 2257 et lois équivalentes sur la vérification des dossiers), les informations d&apos;identité, signatures et documents de vérification fournis seront conservés de façon strictement confidentielle et sécurisée pour la durée minimale exigée par la loi.</p>
            <p style={{ marginTop: 8 }}>La présente autorisation est définitive, irrévocable, exclusive et transmissible. Le Modèle renonce expressément à toute réclamation, poursuite ou recours lié à l&apos;utilisation, la modification ou la publication des œuvres dans le cadre prévu aux présentes.</p>
          </div>
        </div>

        {/* Consentements */}
        <div className="section">
          <div className="section-title">Consentements</div>
          <div className="consent-item">
            <Check ok={consentRecording} />
            <span>J&apos;autorise l&apos;enregistrement de ma participation.</span>
          </div>
          <div className="consent-item">
            <Check ok={consentPub} />
            <span>J&apos;autorise la publication du contenu sur les plateformes prévues (OnlyFans, Faphouse, Fansly, etc.).</span>
          </div>
          <div className="consent-item">
            <Check ok={consentAdult} />
            <span>Je certifie être majeur(e) (18+) et consentir librement et sans contrainte.</span>
          </div>
        </div>

        {/* Signature */}
        <div className="section">
          <div className="section-title">Signature électronique</div>
          {signatureData ? (
            <div className="sig-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureData} alt="Signature" />
            </div>
          ) : (
            <p style={{ color: "#999" }}>Signature non disponible</p>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
            <strong>Signé le :</strong> {signedAt}
            {ipAddress && (
              <span style={{ marginLeft: 24 }}>
                <strong>IP :</strong> {ipAddress}
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
          <span>Ref. participation: {participationId}</span>
          <span>Document généré le {new Date().toLocaleDateString("fr-CA")}</span>
        </div>
      </div>
    </>
  );
}

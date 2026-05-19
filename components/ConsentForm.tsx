"use client";

import { useState, useCallback, useId } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FileUploadZone from "@/components/FileUploadZone";

const SignaturePad = dynamic(() => import("@/components/SignaturePad"), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-full animate-pulse rounded-md bg-muted" />
  ),
});

interface FormState {
  legalName: string;
  stageName: string;
  mainUrl: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
  signatureData: string;
  rectoIdKey: string;
  versoIdKey: string;
  selfieKey: string;
  consentRecording: boolean;
  consentPublication: boolean;
  consentAdult: boolean;
}

interface ConsentFormProps {
  shootId: string;
  shootTitle?: string;
  shootDate?: string;
}

function getEighteenYearsAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

export default function ConsentForm({ shootId, shootTitle, shootDate }: ConsentFormProps) {
  const uid = useId();

  const [docType, setDocType] = useState("");

  const [form, setForm] = useState<FormState>({
    legalName: "",
    stageName: "",
    mainUrl: "",
    birthDate: "",
    email: "",
    phone: "",
    address: "",
    signatureData: "",
    rectoIdKey: "",
    versoIdKey: "",
    selfieKey: "",
    consentRecording: false,
    consentPublication: false,
    consentAdult: false,
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const contractId = `${shootId}-${uid.replace(/:/g, "")}`;

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const isReady =
    form.legalName.trim().length >= 2 &&
    form.stageName.trim().length >= 2 &&
    form.mainUrl.trim().length >= 5 &&
    form.birthDate !== "" &&
    docType !== "" &&
    form.email.includes("@") &&
    form.address.trim().length >= 5 &&
    form.signatureData !== "" &&
    form.rectoIdKey !== "" &&
    form.versoIdKey !== "" &&
    form.selfieKey !== "" &&
    form.consentRecording &&
    form.consentPublication &&
    form.consentAdult;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isReady || status === "submitting") return;

      setStatus("submitting");
      setErrorMsg(null);

      try {
        const res = await fetch("/api/consent/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shootId, docType, ...form }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
        setStatus("success");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur réseau");
        setStatus("error");
      }
    },
    [form, isReady, shootId, status]
  );

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-green-600">Consentement enregistré ✓</CardTitle>
            <CardDescription>
              Merci {form.legalName.split(" ")[0]}. Ton formulaire a bien été soumis.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Model Release Form</CardTitle>
          {shootTitle && (
            <div className="mt-1 rounded-md bg-muted px-3 py-2 text-sm">
              <span className="font-medium">{shootTitle}</span>
              {shootDate && <span className="text-muted-foreground ml-2">{new Date(shootDate).toLocaleDateString("fr-CA")}</span>}
            </div>
          )}
          <CardDescription>
            Tous les champs marqués * sont obligatoires. Tes documents sont chiffrés
            et stockés de façon sécurisée.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

            {/* ── Identité ── */}
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Identité
              </h2>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-legal`}>Nom légal (pièce d&apos;identité) *</Label>
                <Input
                  id={`${uid}-legal`}
                  type="text"
                  autoComplete="name"
                  placeholder="Prénom NOM"
                  value={form.legalName}
                  onChange={(e) => set("legalName", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-stage`}>Nom de scène / Pseudo *</Label>
                <Input
                  id={`${uid}-stage`}
                  type="text"
                  placeholder="ex: OnlyMatt"
                  value={form.stageName}
                  onChange={(e) => set("stageName", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-mainurl`}>Profil principal X / Twitter *</Label>
                <Input
                  id={`${uid}-mainurl`}
                  type="url"
                  placeholder="https://x.com/tonpseudo"
                  value={form.mainUrl}
                  onChange={(e) => set("mainUrl", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-dob`}>Date de naissance *</Label>
                <Input
                  id={`${uid}-dob`}
                  type="date"
                  autoComplete="bday"
                  max={getEighteenYearsAgo()}
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-email`}>Email *</Label>
                <Input
                  id={`${uid}-email`}
                  type="email"
                  autoComplete="email"
                  placeholder="toi@exemple.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-phone`}>Téléphone</Label>
                <Input
                  id={`${uid}-phone`}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 514 xxx xxxx"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-address`}>Adresse *</Label>
                <Input
                  id={`${uid}-address`}
                  type="text"
                  autoComplete="street-address"
                  placeholder="123 Rue Exemple, Montréal, QC H1A 1A1"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  required
                />
              </div>
            </section>

            {/* ── Pièce d'identité ── */}
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pièce d&apos;identité
              </h2>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-doctype`}>Type de document *</Label>
                <select
                  id={`${uid}-doctype`}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  required
                >
                  <option value="">Choisir…</option>
                  <option value="passport">Passeport</option>
                  <option value="drivers_license">Permis de conduire</option>
                  <option value="id_card">Carte d&apos;identité</option>
                </select>
              </div>

              <FileUploadZone
                id={`${uid}-recto`}
                label="Recto de la pièce d'identité *"
                r2Key={`contracts/${contractId}/recto.jpg`}
                onUploaded={(k) => set("rectoIdKey", k)}
              />
              <FileUploadZone
                id={`${uid}-verso`}
                label="Verso de la pièce d'identité *"
                r2Key={`contracts/${contractId}/verso.jpg`}
                onUploaded={(k) => set("versoIdKey", k)}
              />
              <FileUploadZone
                id={`${uid}-selfie`}
                label="Selfie avec la pièce d'identité *"
                r2Key={`contracts/${contractId}/selfie.jpg`}
                onUploaded={(k) => set("selfieKey", k)}
              />
            </section>

            {/* ── Signature ── */}
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Signature *
              </h2>

              <div className="h-32 overflow-y-scroll rounded-md border border-input bg-muted/30 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold mb-1">Contrat de cession de droits à l&apos;image et consentement éclairé</p>
                <p>En signant ce formulaire, le/la soussigné(e) (ci-après « le Modèle ») autorise irrévocablement le photographe/producteur (ci-après « le Producteur ») et ses ayants droit, cessionnaires et licenciés à utiliser, reproduire, modifier, distribuer, publier et concéder sous licence les œuvres photographiques et audiovisuelles réalisées lors de la séance visée par le présent document.</p>
                <p className="mt-2">Cette autorisation porte notamment sur l&apos;exploitation commerciale et la diffusion sur toute plateforme de contenu numérique, de réseaux sociaux ou de plateformes pour adultes (incluant sans s&apos;y limiter OnlyFans, Fansly, Faphouse) ainsi que sur tout autre support numérique ou physique, présent ou futur, sans restriction géographique ni temporelle. Le Modèle reconnaît que cette cession est consentie à titre définitif et n&apos;ouvre droit à aucune rémunération ultérieure, redevance (royalties) ou droit de regard sur l&apos;utilisation du matériel.</p>
                <p className="mt-2 font-medium">Le Modèle certifie sous peine de parjure :</p>
                <ul className="mt-1 list-disc pl-4 space-y-1">
                  <li>Être âgé(e) d&apos;au moins 18 ans à la date de la séance et avoir la pleine capacité juridique.</li>
                  <li>Que les pièces d&apos;identité fournies sont authentiques, valides et le/la représentent fidèlement.</li>
                  <li>Agir librement, de manière éclairée, sans contrainte, menace ni état altéré par une quelconque substance.</li>
                  <li>Avoir lu, compris et accepté l&apos;intégralité du présent contrat avant d&apos;apposer sa signature électronique.</li>
                </ul>
                <p className="mt-2">Conformément aux exigences légales internationales applicables à la production de contenu pour adultes (notamment les normes de type 18 U.S.C. § 2257 et lois équivalentes sur la vérification des dossiers), les informations d&apos;identité, signatures et documents de vérification fournis seront conservés de façon strictement confidentielle et sécurisée pour la durée minimale exigée par la loi.</p>
                <p className="mt-2">La présente autorisation est définitive, irrévocable, exclusive et transmissible. Le Modèle renonce expressément à toute réclamation, poursuite ou recours lié à l&apos;utilisation, la modification ou la publication des œuvres dans le cadre prévu aux présentes.</p>
              </div>

              <SignaturePad
                onChange={(data) => set("signatureData", data)}
                onClear={() => set("signatureData", "")}
              />
            </section>

            {/* ── Consentements ── */}
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Consentements *
              </h2>

              {(
                [
                  {
                    key: "consentRecording",
                    label: "J'autorise l'enregistrement de ma participation.",
                  },
                  {
                    key: "consentPublication",
                    label: "J'autorise la publication du contenu sur les plateformes prévues (OnlyFans, Faphouse, Fansly, etc.).",
                  },
                  {
                    key: "consentAdult",
                    label: "Je certifie être majeur(e) (18+) et consentir librement et sans contrainte.",
                  },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    required
                  />
                  <span>{label}</span>
                </label>
              ))}
            </section>

            {errorMsg && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              disabled={!isReady || status === "submitting"}
              className="w-full"
            >
              {status === "submitting" ? "Envoi en cours…" : "Soumettre le consentement"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

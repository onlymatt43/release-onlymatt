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
}

export default function ConsentForm({ shootId }: ConsentFormProps) {
  const uid = useId();

  const [form, setForm] = useState<FormState>({
    legalName: "",
    stageName: "",
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
    form.birthDate !== "" &&
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
          body: JSON.stringify({ shootId, ...form }),
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
                <Label htmlFor={`${uid}-stage`}>Nom de scène / Pseudo</Label>
                <Input
                  id={`${uid}-stage`}
                  type="text"
                  placeholder="Optionnel"
                  value={form.stageName}
                  onChange={(e) => set("stageName", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-dob`}>Date de naissance *</Label>
                <Input
                  id={`${uid}-dob`}
                  type="date"
                  autoComplete="bday"
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

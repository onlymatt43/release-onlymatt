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

// Chargement dynamique pour éviter les erreurs SSR avec react-signature-canvas
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-full animate-pulse rounded-md bg-muted" />
  ),
});

interface FormState {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  signatureData: string;
  r2KeyIdFront: string;
  r2KeyIdBack: string;
  r2KeySelfie: string;
  consentRecording: boolean;
  consentPublication: boolean;
  consentAdult: boolean;
}

interface ConsentFormProps {
  shootId: string;
}

export default function ConsentForm({ shootId }: ConsentFormProps) {
  const uid = useId(); // préfixe unique pour éviter les collisions d'ID

  const [form, setForm] = useState<FormState>({
    fullName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    signatureData: "",
    r2KeyIdFront: "",
    r2KeyIdBack: "",
    r2KeySelfie: "",
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
    form.fullName.trim().length >= 2 &&
    form.dateOfBirth !== "" &&
    form.email.includes("@") &&
    form.signatureData !== "" &&
    form.r2KeyIdFront !== "" &&
    form.r2KeyIdBack !== "" &&
    form.r2KeySelfie !== "" &&
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
              Merci {form.fullName.split(" ")[0]}. Votre formulaire a bien été soumis.
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
          <CardTitle>Formulaire de consentement</CardTitle>
          <CardDescription>
            Tous les champs sont obligatoires. Vos documents sont chiffrés et
            stockés de façon sécurisée.
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
                <Label htmlFor={`${uid}-name`}>Nom complet</Label>
                <Input
                  id={`${uid}-name`}
                  type="text"
                  autoComplete="name"
                  placeholder="Prénom NOM"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-dob`}>Date de naissance</Label>
                <Input
                  id={`${uid}-dob`}
                  type="date"
                  autoComplete="bday"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-email`}>Email</Label>
                <Input
                  id={`${uid}-email`}
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-phone`}>Téléphone (optionnel)</Label>
                <Input
                  id={`${uid}-phone`}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+33 6 xx xx xx xx"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </section>

            {/* ── Documents d'identité ── */}
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pièce d&apos;identité
              </h2>

              <FileUploadZone
                id={`${uid}-id-front`}
                label="Recto de la pièce d'identité"
                r2Key={`contracts/${contractId}/id_front.jpg`}
                onUploaded={(k) => set("r2KeyIdFront", k)}
              />
              <FileUploadZone
                id={`${uid}-id-back`}
                label="Verso de la pièce d'identité"
                r2Key={`contracts/${contractId}/id_back.jpg`}
                onUploaded={(k) => set("r2KeyIdBack", k)}
              />
              <FileUploadZone
                id={`${uid}-selfie`}
                label="Selfie avec la pièce d'identité"
                r2Key={`contracts/${contractId}/selfie.jpg`}
                onUploaded={(k) => set("r2KeySelfie", k)}
              />
            </section>

            {/* ── Signature ── */}
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Signature
              </h2>
              <SignaturePad
                onChange={(data) => set("signatureData", data)}
                onClear={() => set("signatureData", "")}
              />
            </section>

            {/* ── Consentements ── */}
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Consentements
              </h2>

              {(
                [
                  {
                    key: "consentRecording",
                    label: "J'autorise l'enregistrement de ma participation.",
                  },
                  {
                    key: "consentPublication",
                    label: "J'autorise la publication du contenu sur les plateformes prévues.",
                  },
                  {
                    key: "consentAdult",
                    label: "Je certifie être majeur(e) et consentir librement.",
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

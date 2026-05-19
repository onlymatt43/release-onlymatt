"use client";

import { useRef, useState, useCallback } from "react";
import type { ReactElement } from "react";
import imageCompression from "browser-image-compression";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.95,          // < 1 Mo
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
} as const;

type UploadStatus = "idle" | "compressing" | "uploading" | "done" | "error";

interface FileUploadZoneProps {
  /** Identifiant de l'input (pour le label). */
  id: string;
  /** Libellé affiché à l'utilisateur. */
  label: string;
  /** Clé R2 de destination, ex: "contracts/abc123/id_front". */
  r2Key: string;
  /** Appelé avec la clé R2 finale une fois l'upload terminé. */
  onUploaded: (r2Key: string) => void;
}

export default function FileUploadZone({
  id,
  label,
  r2Key,
  onUploaded,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setStatus("compressing");

      let compressed: File;
      try {
        compressed = await imageCompression(file, COMPRESSION_OPTIONS);
      } catch {
        setStatus("error");
        setError("Erreur lors de la compression de l'image.");
        return;
      }

      // Aperçu local
      setPreview(URL.createObjectURL(compressed));

      setStatus("uploading");

      // 1. Demander une URL présignée au serveur
      let presignedUrl: string;
      try {
        const res = await fetch("/api/consent/sign-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: r2Key, contentType: compressed.type }),
        });
        if (!res.ok) throw new Error(`sign-url: ${res.status}`);
        const data = (await res.json()) as { url: string };
        presignedUrl = data.url;
      } catch (err) {
        setStatus("error");
        setError("Impossible d'obtenir l'URL de téléversement. Réessayez.");
        console.error(err);
        return;
      }

      // 2. PUT direct du fichier compressé vers R2 via l'URL présignée
      try {
        const upload = await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": compressed.type },
          body: compressed,
        });
        if (!upload.ok) throw new Error(`R2 PUT: ${upload.status}`);
      } catch (err) {
        setStatus("error");
        setError("Erreur lors du téléversement. Vérifiez votre connexion.");
        console.error(err);
        return;
      }

      setStatus("done");
      onUploaded(r2Key);
    },
    [r2Key, onUploaded]
  );

  const statusBadge: Record<UploadStatus, ReactElement> = {
    idle:        <Badge variant="secondary">En attente</Badge>,
    compressing: <Badge variant="secondary">Compression…</Badge>,
    uploading:   <Badge variant="secondary">Envoi…</Badge>,
    done:        <Badge className="bg-green-600 text-white">✓ Téléversé</Badge>,
    error:       <Badge variant="destructive">Erreur</Badge>,
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {statusBadge[status]}
      </div>

      <Input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={status === "compressing" || status === "uploading"}
        onChange={handleChange}
        className="cursor-pointer"
      />

      {preview && (
        <img
          src={preview}
          alt={`Aperçu – ${label}`}
          className="mt-1 h-28 w-auto rounded-md border object-cover"
        />
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";

export default function QRCodePanel({ consentUrl }: { consentUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(consentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [consentUrl]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-background p-4">
      <p className="text-sm font-medium text-muted-foreground">Lien de consentement</p>
      <div className="rounded-md bg-white p-3">
        <QRCode value={consentUrl} size={180} />
      </div>
      <p className="break-all text-center text-xs text-muted-foreground">{consentUrl}</p>
      <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
        {copied ? "✓ Copié !" : "Copier le lien"}
      </Button>
    </div>
  );
}

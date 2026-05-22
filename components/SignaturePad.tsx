"use client";

import { useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  /** Appelé à chaque fin de trait avec le data-URL PNG du tracé. */
  onChange: (dataUrl: string) => void;
  /** Appelé lorsque le tracé est effacé. */
  onClear?: () => void;
}

export default function SignaturePad({ onChange, onClear }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleEnd = useCallback(() => {
    const dataUrl = sigRef.current?.toDataURL("image/png");
    if (dataUrl) onChange(dataUrl);
  }, [onChange]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onClear?.();
  }, [onClear]);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full rounded-md border border-slate-700/40 bg-white touch-none overflow-hidden">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: "w-full h-40",
            style: { touchAction: "none" },
          }}
          penColor="black"
          velocityFilterWeight={0.7}
          minWidth={1}
          maxWidth={3}
          onEnd={handleEnd}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClear}
        className="self-end border-slate-700/60 bg-black/40 hover:bg-black/60 text-slate-200"
      >
        Clear signature
      </Button>
    </div>
  );
}

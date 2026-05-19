"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function AddressAutocomplete({
  id,
  value,
  onChange,
  placeholder = "123 Rue Exemple, Montréal, QC H1A 1A1",
  className,
  required,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    if (!GOOGLE_API_KEY || !inputRef.current || autocompleteRef.current) return;

    setOptions({ key: GOOGLE_API_KEY, v: "weekly" });

    importLibrary("places")
      .then(({ Autocomplete }) => {
        if (!inputRef.current) return;
        autocompleteRef.current = new Autocomplete(inputRef.current, {
          types: ["address"],
          fields: ["formatted_address"],
        });
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address);
          }
        });
      })
      .catch(() => setApiError(true));
  }, [onChange]);

  // Keep input in sync when value changes externally
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        defaultValue={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      {apiError && (
        <p className="mt-1 text-xs text-destructive">
          Autocomplétion indisponible — vérifier la clé API.
        </p>
      )}
    </div>
  );
}

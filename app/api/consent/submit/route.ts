import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SubmitPayload {
  shootId: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  signatureData: string;
  r2KeyIdFront: string;
  r2KeyIdBack: string;
  r2KeySelfie: string;
  consentRecording: boolean;
  consentPublication: boolean;
  consentAdult: boolean;
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidR2Key(value: string): boolean {
  return typeof value === "string" && value.startsWith("contracts/") && value.length <= 512;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const p = body as Partial<SubmitPayload>;

  // --- Validation des champs obligatoires ---
  if (!p.shootId || typeof p.shootId !== "string") {
    return NextResponse.json({ error: "shootId is required" }, { status: 422 });
  }
  if (!p.fullName || typeof p.fullName !== "string" || p.fullName.trim().length < 2) {
    return NextResponse.json({ error: "fullName is required" }, { status: 422 });
  }
  if (!p.dateOfBirth || !isValidDate(p.dateOfBirth)) {
    return NextResponse.json({ error: "dateOfBirth must be YYYY-MM-DD" }, { status: 422 });
  }
  if (!p.email || !isValidEmail(p.email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 422 });
  }
  if (!p.signatureData || !p.signatureData.startsWith("data:image/")) {
    return NextResponse.json({ error: "signatureData must be a valid image data-URL" }, { status: 422 });
  }
  for (const keyField of ["r2KeyIdFront", "r2KeyIdBack", "r2KeySelfie"] as const) {
    if (!isValidR2Key(p[keyField] ?? "")) {
      return NextResponse.json({ error: `${keyField} is invalid` }, { status: 422 });
    }
  }
  if (!p.consentRecording || !p.consentPublication || !p.consentAdult) {
    return NextResponse.json({ error: "All consents must be accepted" }, { status: 422 });
  }

  // --- Collecte de métadonnées d'audit (sans exposer de PII via headers) ---
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  try {
    await db.execute({
      sql: `INSERT INTO contracts (
              shoot_id, full_name, date_of_birth, email, phone,
              signature_data,
              r2_key_id_front, r2_key_id_back, r2_key_selfie,
              consent_recording, consent_publication, consent_adult,
              ip_address, user_agent
            ) VALUES (
              :shootId, :fullName, :dateOfBirth, :email, :phone,
              :signatureData,
              :r2KeyIdFront, :r2KeyIdBack, :r2KeySelfie,
              :consentRecording, :consentPublication, :consentAdult,
              :ipAddress, :userAgent
            )`,
      args: {
        shootId: p.shootId,
        fullName: p.fullName.trim(),
        dateOfBirth: p.dateOfBirth,
        email: p.email.toLowerCase().trim(),
        phone: p.phone ?? null,
        signatureData: p.signatureData,
        r2KeyIdFront: p.r2KeyIdFront!,
        r2KeyIdBack: p.r2KeyIdBack!,
        r2KeySelfie: p.r2KeySelfie!,
        consentRecording: p.consentRecording ? 1 : 0,
        consentPublication: p.consentPublication ? 1 : 0,
        consentAdult: p.consentAdult ? 1 : 0,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[consent/submit] DB insert error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

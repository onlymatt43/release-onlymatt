import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface SubmitPayload {
  shootId: string;
  legalName: string;
  stageName: string;
  mainUrl: string;
  category?: string;
  birthDate: string;
  email: string;
  phone?: string;
  address: string;
  signatureData: string;
  rectoIdKey: string;
  versoIdKey: string;
  selfieKey: string;
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

  if (!p.shootId || typeof p.shootId !== "string")
    return NextResponse.json({ error: "shootId is required" }, { status: 422 });
  if (!p.legalName || typeof p.legalName !== "string" || p.legalName.trim().length < 2)
    return NextResponse.json({ error: "legalName is required" }, { status: 422 });
  if (!p.stageName || typeof p.stageName !== "string" || p.stageName.trim().length < 2)
    return NextResponse.json({ error: "stageName is required" }, { status: 422 });
  if (!p.mainUrl || typeof p.mainUrl !== "string" || p.mainUrl.trim().length < 5)
    return NextResponse.json({ error: "mainUrl is required" }, { status: 422 });
  if (!p.birthDate || !isValidDate(p.birthDate))
    return NextResponse.json({ error: "birthDate must be YYYY-MM-DD" }, { status: 422 });
  if (!p.email || !isValidEmail(p.email))
    return NextResponse.json({ error: "A valid email is required" }, { status: 422 });
  if (!p.address || typeof p.address !== "string" || p.address.trim().length < 5)
    return NextResponse.json({ error: "address is required" }, { status: 422 });
  if (!p.signatureData || !p.signatureData.startsWith("data:image/"))
    return NextResponse.json({ error: "signatureData must be a valid image data-URL" }, { status: 422 });
  for (const keyField of ["rectoIdKey", "versoIdKey", "selfieKey"] as const) {
    if (!isValidR2Key(p[keyField] ?? ""))
      return NextResponse.json({ error: `${keyField} is invalid` }, { status: 422 });
  }
  if (!p.consentRecording || !p.consentPublication || !p.consentAdult)
    return NextResponse.json({ error: "All consents must be accepted" }, { status: 422 });

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  try {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO contracts (
              shoot_id, legal_name, stage_name, main_url, category, birth_date, email, phone, address,
              signature_data,
              recto_id_key, verso_id_key, selfie_key,
              consent_recording, consent_publication, consent_adult,
              ip_address, user_agent
            ) VALUES (
              :shootId, :legalName, :stageName, :mainUrl, :category, :birthDate, :email, :phone, :address,
              :signatureData,
              :rectoIdKey, :versoIdKey, :selfieKey,
              :consentRecording, :consentPublication, :consentAdult,
              :ipAddress, :userAgent
            )`,
      args: {
        shootId: p.shootId,
        legalName: p.legalName.trim(),
        stageName: p.stageName.trim(),
        mainUrl: p.mainUrl.trim(),
        category: p.category?.trim() || null,
        birthDate: p.birthDate,
        email: p.email.toLowerCase().trim(),
        phone: p.phone?.trim() ?? null,
        address: p.address.trim(),
        signatureData: p.signatureData,
        rectoIdKey: p.rectoIdKey!,
        versoIdKey: p.versoIdKey!,
        selfieKey: p.selfieKey!,
        consentRecording: p.consentRecording ? 1 : 0,
        consentPublication: p.consentPublication ? 1 : 0,
        consentAdult: p.consentAdult ? 1 : 0,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[consent/submit] DB insert error:", message);
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}

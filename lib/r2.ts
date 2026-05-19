import { S3Client } from "@aws-sdk/client-s3";

// Client instancié à la demande (évite les throws au build Vercel)
let _client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (_client) return _client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId)       throw new Error("Missing env variable: R2_ACCOUNT_ID");
  if (!accessKeyId)     throw new Error("Missing env variable: R2_ACCESS_KEY_ID");
  if (!secretAccessKey) throw new Error("Missing env variable: R2_SECRET_ACCESS_KEY");

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _client;
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "release-onlymatt";

import { createClient } from "@libsql/client";

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("Missing env variable: TURSO_DATABASE_URL");
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("Missing env variable: TURSO_AUTH_TOKEN");
}

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

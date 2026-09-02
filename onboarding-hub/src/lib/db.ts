import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

export function db() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  if (!client) {
    const requiresSsl = new URL(databaseUrl).searchParams.get("sslmode") === "require"
      || process.env.NODE_ENV === "production";
    client = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: requiresSsl ? "require" : false,
    });
  }

  return client;
}

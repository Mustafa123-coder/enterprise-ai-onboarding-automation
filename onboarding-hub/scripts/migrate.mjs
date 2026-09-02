import { readFile } from "node:fs/promises";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required. Copy .env.example to .env.local and configure PostgreSQL.");
  process.exit(1);
}

const requiresSsl = new URL(databaseUrl).searchParams.get("sslmode") === "require"
  || process.env.NODE_ENV === "production";
const sql = postgres(databaseUrl, {
  max: 1,
  ssl: requiresSsl ? "require" : false,
});

try {
  const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  await sql.unsafe(schema);
  console.log("Database schema and seed data are ready.");
} finally {
  await sql.end();
}

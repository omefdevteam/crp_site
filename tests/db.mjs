import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

// A throwaway PostgreSQL cluster for one test run, migrated with the same SQL
// files production runs. Nothing is mocked below the application code, so the
// tests see real transactions, row locks, and unique indexes.
export async function startDatabase() {
  const port = 54_000 + Math.floor(Math.random() * 1000);
  const databaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "crp-pg-"));
  const cluster = new EmbeddedPostgres({
    databaseDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  await cluster.initialise();
  await cluster.start();
  await cluster.createDatabase("crp_test");
  const url = `postgres://postgres:postgres@127.0.0.1:${port}/crp_test`;

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));
  for (const entry of journal.entries) {
    const sql = fs.readFileSync(`drizzle/${entry.tag}.sql`, "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await client.query(statement);
    }
  }
  await client.end();

  return {
    url,
    async stop() {
      try { await cluster.stop(); } catch { /* already stopped */ }
      // Windows keeps file handles briefly after the process exits.
      for (let i = 0; i < 5; i++) {
        try {
          fs.rmSync(databaseDir, { recursive: true, force: true });
          return;
        } catch (err) {
          if (i === 4) return;
          await new Promise((resolve) => setTimeout(resolve, 200));
          void err;
        }
      }
    },
  };
}

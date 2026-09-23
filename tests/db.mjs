import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

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
    persistent: true, // Cleanup below verifies the exact temporary path first.
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
      if (path.dirname(path.resolve(databaseDir)) !== path.resolve(os.tmpdir()) || !path.basename(databaseDir).startsWith("crp-pg-")) {
        throw new Error("refusing to remove a directory outside the test database location");
      }
      const stopping = cluster.stop();
      // embedded-postgres uses taskkill /t on Windows, which can stall in a
      // restricted shell. pg_ctl signals this exact cluster without WMI.
      if (process.platform === "win32" && fs.existsSync(path.join(databaseDir, "postmaster.pid"))) {
        const { pg_ctl } = await import("@embedded-postgres/windows-x64");
        try {
          await promisify(execFile)(pg_ctl, ["stop", "-D", databaseDir, "-m", "fast", "-W"], { windowsHide: true, timeout: 15_000 });
        } catch (err) {
          if (fs.existsSync(path.join(databaseDir, "postmaster.pid"))) throw err;
        }
      }
      await stopping;
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

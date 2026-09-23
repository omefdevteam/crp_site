import { createHash, randomBytes } from "node:crypto";
const id = process.argv[2]?.trim();
if (!id || id.length > 120) {
  console.error("Usage: node scripts/create-operator.mjs <operator-id>");
  process.exit(1);
}
const token = randomBytes(32).toString("base64url");
const credential = { id, tokenHash: createHash("sha256").update(token).digest("hex") };
console.log("Store this bearer token securely; it is shown only here:");
console.log(token);
console.log("Append this entry to the OPERATIONS_TOKENS JSON array on the server:");
console.log(JSON.stringify(credential));

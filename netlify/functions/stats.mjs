// GET /api/stats -> public demand snapshot for the practitioner page (only shown once there's enough to be meaningful).
import { json, events, month } from "../lib/hy.mjs";
export default async () => {
  const m = month(), { blobs } = await events().list({ prefix: `demand/${m}/` });
  const byState = {}, byConcern = {}; let total = 0, unmatched = 0;
  for (const b of blobs) { const [, , st, c, , , n] = b.key.split("/"); total++; byState[st] = (byState[st] || 0) + 1; if (c !== "none") byConcern[c] = (byConcern[c] || 0) + 1; if (n === "0") unmatched++; }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return new Response(JSON.stringify({ month: m, total, unmatched, states: top(byState), concerns: top(byConcern) }), { headers: { "content-type": "application/json", "cache-control": "public, max-age=600" } });
};
export const config = { path: "/api/stats" };

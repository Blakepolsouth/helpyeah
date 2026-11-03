// /api/admin (needs the ADMIN_KEY you set in Netlify, sent as the x-admin-key header)
//   GET  -> { listings, demand, clicks, waitlist }
//   POST { action: "approve" | "unlist" | "delete" | "update", id, fields }
import { json, listings, events, isAdmin, allListings, month } from "../lib/hy.mjs";
export default async (req) => {
  const ok = isAdmin(req);
  if (ok === null) return json({ error: "Set an ADMIN_KEY (8+ characters) in Netlify → Site configuration → Environment variables, then redeploy." }, 503);
  if (!ok) return json({ error: "Wrong admin key" }, 401);
  const ev = events();
  if (req.method === "GET") {
    const [list, dem, clk, wait] = await Promise.all([allListings(), ev.list({ prefix: "demand/" }), ev.list({ prefix: "click/" }), ev.list({ prefix: "notify/" })]);
    const demand = {}; for (const b of dem.blobs) { const [, m, st, c, h, mode, n] = b.key.split("/"); const d = demand[m] = demand[m] || { total: 0, unmatched: 0, states: {}, concerns: {}, help: {} }; d.total++; if (n === "0") d.unmatched++; d.states[st] = (d.states[st] || 0) + 1; d.concerns[c] = (d.concerns[c] || 0) + 1; d.help[h] = (d.help[h] || 0) + 1; }
    const clicks = {}; for (const b of clk.blobs) { const [, m, id] = b.key.split("/"); (clicks[id] = clicks[id] || {})[m] = (clicks[id][m] || 0) + 1; }
    const waitlist = (await Promise.all(wait.blobs.map(b => ev.get(b.key, { type: "json" }).catch(() => null)))).filter(Boolean);
    return json({ listings: list.sort((a, b) => b.created - a.created), demand, clicks, waitlist, month: month() });
  }
  if (req.method !== "POST") return json({ error: "Use GET or POST" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const s = listings(), p = await s.get(String(b.id || ""), { type: "json" });
  if (!p) return json({ error: "Not found" }, 404);
  if (b.action === "delete") { await s.delete(p.id); return json({ ok: true }); }
  if (b.action === "approve") { p.approved = true; p.approvedAt = Date.now(); }
  else if (b.action === "unlist") p.approved = false;
  else if (b.action === "accepting") p.accepting = !!b.value;
  else return json({ error: "Unknown action" }, 400);
  await s.setJSON(p.id, p);
  return json({ ok: true, listing: p });
};
export const config = { path: "/api/admin" };

// Shared helpers for HelpYeah functions.
import { getStore } from "@netlify/blobs";
import { timingSafeEqual, randomBytes } from "node:crypto";

export const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export const listings = () => getStore({ name: "hy-listings", consistency: "strong" });
export const events = () => getStore({ name: "hy-events", consistency: "strong" });   // demand, clicks, waitlist (one small blob per event, so nothing overwrites)
export const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
export const rid = () => randomBytes(6).toString("hex");
export const month = (d = new Date()) => d.toISOString().slice(0, 7);
export const safeUrl = u => { try { const x = new URL(String(u || "").trim()); return x.protocol === "https:" || x.protocol === "http:" ? x.toString().slice(0, 400) : ""; } catch { return ""; } };

export function isAdmin(req) {
  const want = process.env.ADMIN_KEY || "", got = req.headers.get("x-admin-key") || "";
  if (!want || want.length < 8) return null;          // not configured
  const a = Buffer.from(want), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function allListings() {
  const s = listings(), { blobs } = await s.list();
  const out = await Promise.all(blobs.map(b => s.get(b.key, { type: "json" }).catch(() => null)));
  return out.filter(Boolean);
}

// POST /api/notify { email, state, concern, help }  -> patient wants a heads-up when a practitioner in their state joins.
import { json, events, month, clean, rid } from "../lib/hy.mjs";
import { STATE, CONCERN } from "../../public/data.js";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  if (b.website) return json({ ok: true });                       // honeypot
  const email = clean(b.email, 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return json({ error: "That email doesn't look right" }, 400);
  const state = STATE[b.state] ? b.state : "", concern = CONCERN[b.concern] ? b.concern : "";
  if (!state) return json({ error: "Missing state" }, 400);
  await events().setJSON(`notify/${state}/${rid()}`, { email, state, concern, help: clean(b.help, 20), at: Date.now(), month: month() });
  return json({ ok: true });
};
export const config = { path: "/api/notify" };

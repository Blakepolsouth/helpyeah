// POST /api/apply  -> a practitioner asks to be listed. Saved as pending until you approve it in /admin.
import { json, listings, clean, rid, safeUrl } from "../lib/hy.mjs";
import { TYPES, CONCERN, STATE, PRICE, INSURANCE } from "../../public/data.js";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  if (b.website) return json({ ok: true });                       // honeypot
  const p = {
    id: rid(), approved: false, created: Date.now(), accepting: true,
    name: clean(b.name, 80), creds: clean(b.creds, 60), type: TYPES[b.type] ? b.type : "",
    practice: clean(b.practice, 100), email: clean(b.email, 120).toLowerCase(), phone: clean(b.phone, 30),
    site: safeUrl(b.site), booking: safeUrl(b.booking), photo: safeUrl(b.photo),
    online: !!b.online, inPerson: !!b.inPerson, city: clean(b.city, 60), officeState: STATE[b.officeState] ? b.officeState : "",
    anywhere: !!b.anywhere && b.type === "coach",
    states: (Array.isArray(b.states) ? b.states : []).filter(s => STATE[s]).slice(0, 51),
    licenses: clean(b.licenses, 600),
    focus: (Array.isArray(b.focus) ? b.focus : []).filter(c => CONCERN[c]).slice(0, 5),
    approach: clean(b.approach, 400), price: PRICE[b.price] ? b.price : "", insurance: INSURANCE[b.insurance] ? b.insurance : "none",
    freeIntro: !!b.freeIntro, training: clean(b.training, 300), heard: clean(b.heard, 120)
  };
  const missing = [];
  if (!p.name) missing.push("your name"); if (!p.type) missing.push("practitioner type");
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(p.email)) missing.push("a valid email");
  if (!p.booking) missing.push("a booking or contact link");
  if (!p.online && !p.inPerson) missing.push("online or in person");
  if (p.online && !p.anywhere && !p.states.length) missing.push("states you can see clients in");
  if (p.inPerson && !p.officeState) missing.push("your office state");
  if (!p.focus.length) missing.push("at least one focus area");
  if (missing.length) return json({ error: "Please add " + missing.join(", ") + "." }, 400);
  await listings().setJSON(p.id, p);
  return json({ ok: true });
};
export const config = { path: "/api/apply" };

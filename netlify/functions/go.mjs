// GET /go/:id  -> counts the click and sends the patient to the practitioner's own booking page.
import { json, listings, events, month, rid } from "../lib/hy.mjs";
export default async (req) => {
  const id = new URL(req.url).pathname.split("/").pop().replace(/[^a-z0-9]/gi, "").slice(0, 40);
  const p = id ? await listings().get(id, { type: "json" }) : null;
  if (!p || !p.approved || !p.booking) return Response.redirect(new URL("/", req.url).toString(), 302);
  try { await events().set(`click/${month()}/${id}/${rid()}`, "1"); } catch {}
  const u = new URL(p.booking); if (!u.searchParams.has("ref")) u.searchParams.set("ref", "helpyeah");
  return Response.redirect(u.toString(), 302);
};
export const config = { path: "/go/*" };

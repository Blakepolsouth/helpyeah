// POST /api/match  { concerns: [..], help, mode, state, budget }  ->  { matches: [...], total }
// Also counts demand (state + concern + kind of help) so practitioners can see where patients are looking. No personal info is stored.
import { json, events, month, rid, allListings } from "../lib/hy.mjs";
import { match, publicView, CONCERN, STATE, HELP } from "../../public/data.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let a; try { a = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const ans = {
    concerns: (Array.isArray(a.concerns) ? a.concerns : []).filter(c => CONCERN[c]).slice(0, 2),
    help: HELP.some(h => h[0] === a.help) ? a.help : "unsure",
    mode: ["online", "inperson", "either"].includes(a.mode) ? a.mode : "either",
    state: STATE[a.state] ? a.state : "",
    budget: ["low", "mid", "high", "insurance"].includes(a.budget) ? a.budget : ""
  };
  if (!ans.state) return json({ error: "Pick your state" }, 400);
  const list = await allListings();
  const day = Math.floor(Date.now() / 864e5);
  const res = match(list, ans, day).map(x => ({ ...publicView(x.p), overlap: x.overlap }));
  if (!a.repeat) {   // count once per quiz, not on every re-run
    const key = `demand/${month()}/${ans.state}/${ans.concerns[0] || "none"}/${ans.help}/${ans.mode}/${res.length}/${rid()}`;
    try { await events().set(key, "1"); } catch {}
  }
  return json({ matches: res, answers: ans });
};
export const config = { path: "/api/match" };

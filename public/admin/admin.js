import { TYPES, CONCERN, STATE, PRICE, INSURANCE } from "../data.js";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let KEY = sessionStorage.getItem("hyk") || "", D = null, tab = "pending";

async function api(method, body) {
  const r = await fetch("/api/admin", { method, headers: { "x-admin-key": KEY, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); return j;
}
async function load() {
  try { D = await api("GET"); sessionStorage.setItem("hyk", KEY); $("#login").hidden = true; $("#panel").hidden = false; render(); }
  catch (e) { $("#lerr").textContent = e.message; $("#lerr").hidden = false; $("#login").hidden = false; $("#panel").hidden = true; }
}
$("#login").addEventListener("submit", e => { e.preventDefault(); KEY = $("#key").value.trim(); load(); });
document.querySelector(".tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; tab = b.dataset.t; document.querySelectorAll(".tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b))); render(); });

const lookup = p => { const st = (p.states || [])[0] || p.officeState || ""; const board = { md: "medical board", nd: "naturopathic board", nutrition: "dietetics nutrition license", coach: "" }[p.type]; return `https://www.google.com/search?q=${encodeURIComponent(`${STATE[st] || ""} ${board} license lookup`)}`; };
function appCard(p, live) {
  const clicks = D.clicks[p.id] || {}, cm = clicks[D.month] || 0, total = Object.values(clicks).reduce((a, b) => a + b, 0);
  return `<article class="card app" data-id="${p.id}">
    <div class="pname">${esc(p.name)}${p.creds ? `, ${esc(p.creds)}` : ""}</div>
    <dl>
      <dt>Type</dt><dd>${esc(TYPES[p.type]?.label)}</dd><dt>Practice</dt><dd>${esc(p.practice)}</dd>
      <dt>Email</dt><dd><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></dd>
      <dt>Booking</dt><dd><a href="${esc(p.booking)}" target="_blank" rel="noopener">${esc(p.booking)}</a></dd>
      ${p.site ? `<dt>Website</dt><dd><a href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.site)}</a></dd>` : ""}
      <dt>Sees</dt><dd>${[p.online && `Online: ${p.anywhere ? "anywhere in US" : (p.states || []).join(", ")}`, p.inPerson && `In person: ${esc(p.city)}, ${p.officeState}`].filter(Boolean).join("<br>")}</dd>
      ${p.type !== "coach" ? `<dt>Licenses</dt><dd>${esc(p.licenses) || "<b style='color:var(--warn)'>none given</b>"}</dd>` : ""}
      <dt>Focus</dt><dd>${(p.focus || []).map(f => esc(CONCERN[f])).join(", ")}</dd>
      <dt>Approach</dt><dd>${esc(p.approach)}</dd><dt>Training</dt><dd>${esc(p.training)}</dd>
      <dt>Price</dt><dd>${esc(PRICE[p.price] || "—")} · ${esc(INSURANCE[p.insurance])}${p.freeIntro ? " · free intro" : ""}</dd>
      <dt>Heard via</dt><dd>${esc(p.heard)}</dd><dt>Applied</dt><dd>${new Date(p.created).toLocaleDateString()}</dd>
      ${live ? `<dt>Patients sent</dt><dd><b>${cm}</b> this month · ${total} all time</dd>` : ""}
    </dl>
    <div class="row">${live
      ? `<button data-a="accepting" data-v="${p.accepting === false}">${p.accepting === false ? "Mark accepting patients" : "Pause (not accepting)"}</button><button data-a="unlist">Unlist</button><button class="del" data-a="delete">Delete</button>`
      : `${p.type !== "coach" ? `<a href="${lookup(p)}" target="_blank" rel="noopener">Find license lookup</a>` : ""}<button class="go" data-a="approve">Approve & go live</button><button class="del" data-a="delete">Delete</button>`}</div>
  </article>`;
}
function table(obj, label, map) { const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]); return rows.length ? `<table><tr><th>${label}</th><th>Searches</th></tr>${rows.map(([k, n]) => `<tr><td>${esc(map ? (map[k] || k) : k)}</td><td>${n}</td></tr>`).join("")}</table>` : `<p class="muted">Nothing yet.</p>`; }
function render() {
  const v = $("#view"), L = D.listings;
  if (tab === "pending") { const p = L.filter(x => !x.approved); v.innerHTML = p.length ? p.map(x => appCard(x, false)).join("") : `<p class="muted">No pending applications.</p>`; }
  if (tab === "live") { const p = L.filter(x => x.approved); v.innerHTML = `<p class="muted">${p.length} live practitioner${p.length === 1 ? "" : "s"}.</p>` + p.map(x => appCard(x, true)).join(""); }
  if (tab === "demand") {
    const months = Object.keys(D.demand).sort().reverse(), m = months[0], d = D.demand[m];
    v.innerHTML = !d ? `<p class="muted">No searches yet.</p>` : `<div class="card"><div class="big">${d.total}</div><p class="muted" style="margin:0">searches in ${m} · <b>${d.unmatched}</b> found no match</p></div>
      <div class="card"><h3 style="margin-bottom:8px">By state</h3>${table(d.states, "State", STATE)}</div>
      <div class="card"><h3 style="margin-bottom:8px">By concern</h3>${table(d.concerns, "Concern", { ...CONCERN, none: "Not chosen" })}</div>
      <div class="card"><h3 style="margin-bottom:8px">Help wanted</h3>${table(d.help, "Type", { "labs-rx": "Labs & prescribing", natural: "Natural + labs", food: "Nutrition", habits: "Coaching", unsure: "Not sure" })}</div>
      ${months.length > 1 ? `<p class="muted">Earlier: ${months.slice(1).map(x => `${x}: ${D.demand[x].total}`).join(" · ")}</p>` : ""}`;
  }
  if (tab === "wait") {
    const by = {}; D.waitlist.forEach(w => { by[w.state] = (by[w.state] || 0) + 1; });
    v.innerHTML = `<div class="card"><div class="big">${D.waitlist.length}</div><p class="muted" style="margin:0">patients waiting to hear about a practitioner</p></div>
      <div class="card">${table(by, "State", STATE)}</div><div class="row"><button id="csv">Download CSV</button></div>`;
  }
}
$("#view").addEventListener("click", async e => {
  if (e.target.id === "csv") {
    const rows = [["email", "state", "concern", "help", "date"], ...D.waitlist.map(w => [w.email, w.state, w.concern, w.help, new Date(w.at).toISOString().slice(0, 10)])];
    const blob = new Blob([rows.map(r => r.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "helpyeah-waitlist.csv"; a.click(); return;
  }
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const id = b.closest("[data-id]").dataset.id, action = b.dataset.a;
  if (action === "delete" && !confirm("Delete this listing for good?")) return;
  b.disabled = true;
  try { await api("POST", { action, id, value: b.dataset.v === "true" }); await load(); } catch (x) { alert(x.message); b.disabled = false; }
});
if (KEY) load();

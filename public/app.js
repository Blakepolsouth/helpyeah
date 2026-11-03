import { CONCERNS, CONCERN, TYPES, HELP, BUDGETS, STATES, STATE, PRICE, INSURANCE } from "./data.js";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem("hy:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem("hy:" + k, JSON.stringify(v)); } catch {} } };

/* Who's who */
$("#typeCards").innerHTML = Object.values(TYPES).map(t => `<div class="type"><h3>${esc(t.label)}</h3><p>${esc(t.can)}</p><p><b>Good for:</b> ${esc(t.good)}</p></div>`).join("");

/* Quiz */
const A = Object.assign({ concerns: [], help: "", mode: "", state: "", budget: "" }, store.get("answers", {}));
const STEPS = [
  { key: "concerns", title: "What's been going on?", hint: "Pick up to two.", multi: 2, grid: true, opts: CONCERNS.map(([k, l]) => [k, l]) },
  { key: "help", title: "What kind of help sounds right?", hint: "Not sure is a perfectly good answer.", opts: HELP.map(([k, l, t]) => [k, l, k === "unsure" ? "We'll show you a mix and explain the difference." : t.map(x => TYPES[x].short).join(" or ")]) },
  { key: "mode", title: "Online or in person?", hint: "Online opens up a lot more options.", opts: [["online", "Online is great"], ["inperson", "In person, near me"], ["either", "Either works"]] },
  { key: "state", title: "Which state are you in?", hint: "Practitioners can usually only see you in states where they're licensed, so this matters.", select: true },
  { key: "budget", title: "What fits your budget for a first visit?", hint: "Most functional care is self-pay, but some practitioners take insurance or give you a receipt to submit.", opts: BUDGETS.map(([k, l]) => [k, l]) }
];
let step = 0, repeat = false;

function renderStep() {
  const S = STEPS[step];
  $("#qstep").textContent = `${step + 1} of ${STEPS.length}`;
  $("#bar").style.width = `${(step / STEPS.length) * 100}%`;
  $("#back").style.visibility = step ? "visible" : "hidden";
  let body = `<h2 id="qtitle">${esc(S.title)}</h2><p class="qhint">${esc(S.hint)}</p>`;
  if (S.select) body += `<select id="stateSel" aria-labelledby="qtitle"><option value="">Choose your state</option>${STATES.map(([k, n]) => `<option value="${k}"${A.state === k ? " selected" : ""}>${n}</option>`).join("")}</select>`;
  else body += `<div class="opts${S.grid ? " grid" : ""}" role="${S.multi ? "group" : "radiogroup"}" aria-labelledby="qtitle">${S.opts.map(([k, l, sub]) => {
    const on = S.multi ? A[S.key].includes(k) : A[S.key] === k;
    return `<button type="button" class="opt" data-k="${k}" ${S.multi ? `aria-pressed="${on}"` : `role="radio" aria-checked="${on}"`}><span>${esc(l)}${sub ? `<small>${esc(sub)}</small>` : ""}</span></button>`;
  }).join("")}</div>`;
  $("#qbody").innerHTML = body;
  $("#next").textContent = step === STEPS.length - 1 ? "Show my matches" : "Next";
  validate();
}
function validate() { const S = STEPS[step], v = A[S.key]; $("#next").disabled = S.multi ? !v.length : !v; }
$("#qbody").addEventListener("click", e => {
  const b = e.target.closest(".opt"); if (!b) return;
  const S = STEPS[step], k = b.dataset.k;
  if (S.multi) {
    const arr = A[S.key], i = arr.indexOf(k);
    if (i >= 0) arr.splice(i, 1); else { if (arr.length >= S.multi) arr.shift(); arr.push(k); }
    renderStep();
  } else { A[S.key] = k; renderStep(); setTimeout(() => { if (A[S.key] === k) go(1); }, 220); }   // single choice: move on by itself
});
$("#qbody").addEventListener("change", e => { if (e.target.id === "stateSel") { A.state = e.target.value; validate(); } });
$("#next").addEventListener("click", () => go(1));
$("#back").addEventListener("click", () => go(-1));
function go(d) {
  store.set("answers", A);
  if (d > 0 && step === STEPS.length - 1) { submit(); return; }
  step = Math.max(0, Math.min(STEPS.length - 1, step + d)); renderStep();
}
function startQuiz() {
  step = 0; $("#hero").hidden = true; $("#results").hidden = true; $("#quiz").hidden = false; renderStep();
  $("#quiz").scrollIntoView({ behavior: "smooth", block: "start" });
}
$("#start").addEventListener("click", startQuiz);

/* Results */
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
async function submit() {
  $("#next").disabled = true; $("#next").textContent = "Finding your matches…";
  let data;
  try {
    const r = await fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...A, repeat }) });
    data = await r.json(); if (!r.ok) throw new Error(data.error || "error");
  } catch (e) { $("#next").disabled = false; $("#next").textContent = "Show my matches"; toast("Couldn't reach HelpYeah. Check your connection and try again."); return; }
  repeat = true;
  $("#quiz").hidden = true; renderResults(data.matches || []);
}
function card(p) {
  const t = TYPES[p.type] || {}, where = [p.online && "Online", p.inPerson && p.city && `In person in ${p.city}, ${p.officeState}`].filter(Boolean).join(" · ");
  const focus = (p.focus || []).map(f => `<span class="chip${A.concerns.includes(f) ? " hit" : ""}">${esc(CONCERN[f])}</span>`).join("");
  return `<article class="card pcard">
    <div class="phead"><div class="avatar">${p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : esc(initials(p.name))}</div>
      <div><div class="pname">${esc(p.name)}${p.creds ? `, ${esc(p.creds)}` : ""}</div><div class="pmeta">${esc(p.practice || t.label)}</div></div></div>
    <div class="ptype"><b>${esc(t.label)}.</b> ${esc(t.can)}</div>
    <div class="chips">${focus}${p.freeIntro ? `<span class="chip gold">Free intro call</span>` : ""}</div>
    ${p.approach ? `<p class="papproach">${esc(p.approach)}</p>` : ""}
    <ul class="facts"><li>${esc(where)}</li>${p.price ? `<li>${esc(PRICE[p.price])}</li>` : ""}<li>${esc(INSURANCE[p.insurance] || "Self-pay")}</li></ul>
    <a class="book" href="/go/${encodeURIComponent(p.id)}" target="_blank" rel="noopener">See availability with ${esc(p.name.split(" ")[0])}</a>
  </article>`;
}
function renderResults(list) {
  const st = STATE[A.state], el = $("#results"), unsure = A.help === "unsure";
  const notify = `<form class="notify" id="notifyForm"><input type="email" name="email" placeholder="you@email.com" autocomplete="email" required aria-label="Your email"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit">Let me know</button></form>`;
  let html = "";
  if (list.length) {
    html += `<h2>${list.length === 1 ? "Here's your match" : `Here are your ${list.length} best matches`}</h2>
      <p class="rsub">${unsure ? "A mix of practitioner types, so you can see which approach feels right." : `Practitioners who can see you in ${esc(st)} and focus on what you're dealing with.`}</p>`;
    html += list.map(card).join("");
    if (list.length < 3) html += `<div class="empty"><h3>More are on the way</h3><p>We're adding practitioners in ${esc(st)} every week. Want a heads-up when there are more options for you?</p>${notify}</div>`;
  } else {
    html += `<div class="empty"><h3>You're early, and that's a good thing.</h3>
      <p>We're still adding practitioners who can see patients in <b>${esc(st)}</b>. Leave your email and we'll tell you the moment someone who fits joins. One email, no spam.</p>${notify}
      <p class="muted" style="font-size:14px">Meanwhile, check out "Who's who" below. Knowing which type of practitioner fits you puts you ahead of most people.</p></div>`;
  }
  html += `<button class="redo" id="redo" type="button">Change my answers</button>`;
  el.innerHTML = html; el.hidden = false; el.scrollIntoView({ behavior: "smooth", block: "start" });
}
$("#results").addEventListener("click", e => { if (e.target.closest("#redo")) startQuiz(); });
$("#results").addEventListener("submit", async e => {
  if (e.target.id !== "notifyForm") return; e.preventDefault();
  const f = e.target, btn = f.querySelector("button");
  btn.disabled = true;
  try {
    const r = await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.email.value, website: f.website.value, state: A.state, concern: A.concerns[0] || "", help: A.help }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    f.outerHTML = `<p><b>You're on the list.</b> We'll email you when someone who fits joins in ${esc(STATE[A.state])}.</p>`;
  } catch (err) { btn.disabled = false; toast(err.message || "Couldn't save that. Try again?"); }
});

let tt; function toast(m) { let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2600); }

import { CONCERNS, CONCERN, TYPES, STATES, STATE, PRICE, INSURANCE } from "../data.js";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const f = $("#applyForm"), E = n => f.elements.namedItem(n);   // (form.name would clash with the "name" field)

$("#typeChecks").innerHTML = Object.entries(TYPES).map(([k, t]) => `<label class="check"><input type="radio" name="type" value="${k}"> ${esc(t.label)}</label>`).join("");
$("#focusChecks").innerHTML = CONCERNS.map(([k, l]) => `<label class="check"><input type="checkbox" name="focus" value="${k}"> ${esc(l)}</label>`).join("");
$("#priceChecks").innerHTML = Object.entries(PRICE).map(([k, l]) => `<label class="check"><input type="radio" name="price" value="${k}"> ${esc(l.replace(" first visit", ""))}</label>`).join("");
$("#insChecks").innerHTML = Object.entries(INSURANCE).map(([k, l]) => `<label class="check"><input type="radio" name="insurance" value="${k}"${k === "none" ? " checked" : ""}> ${esc(l)}</label>`).join("");
$("#statesBox").innerHTML = STATES.map(([k, n]) => `<label title="${n}"><input type="checkbox" name="states" value="${k}"> ${k}</label>`).join("");
$("#officeState").innerHTML = `<option value="">State</option>` + STATES.map(([k]) => `<option>${k}</option>`).join("");

function sync() {
  const type = E("type").value, coach = type === "coach", online = E("online").checked, anywhere = coach && E("anywhere").checked;
  $("#anywhereWrap").hidden = !coach || !online;
  $("#statesField").hidden = !online;
  $("#statesBox").hidden = anywhere;
  $("#officeField").hidden = !E("inPerson").checked;
  $("#licField").hidden = coach;
  $("#statesHint").textContent = coach ? "Coaching usually isn't licensed, but some states limit nutrition advice. Pick where you work, or choose anywhere in the US." : "Only states where you're licensed or legally allowed to practice. We match patients by this.";
  const max = 5, picked = $$('input[name="focus"]:checked').length;
  $$('input[name="focus"]').forEach(i => { i.disabled = !i.checked && picked >= max; });
  $("#apCount").textContent = E("approach").value.length;
}
f.addEventListener("change", sync); f.addEventListener("input", e => { if (e.target.name === "approach") sync(); }); sync();

f.addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    name: E("name").value, creds: E("creds").value, type: E("type").value, practice: E("practice").value, email: E("email").value,
    booking: E("booking").value, site: E("site").value, photo: E("photo").value, online: E("online").checked, inPerson: E("inPerson").checked,
    anywhere: E("anywhere").checked, states: $$('input[name="states"]:checked').map(i => i.value), city: E("city").value, officeState: E("officeState").value,
    licenses: E("licenses").value, focus: $$('input[name="focus"]:checked').map(i => i.value), approach: E("approach").value, training: E("training").value,
    price: E("price").value, insurance: E("insurance").value, freeIntro: E("freeIntro").checked, heard: E("heard").value, website: E("website").value
  };
  const btn = $("#submitBtn"), err = $("#err"); btn.disabled = true; btn.textContent = "Sending…"; err.hidden = true;
  try {
    const r = await fetch("/api/apply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || "Something went wrong.");
    $("#formCard").hidden = true; $("#done").hidden = false; $("#done").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (x) { err.textContent = x.message; err.hidden = false; btn.disabled = false; btn.textContent = "Send my application"; err.scrollIntoView({ behavior: "smooth", block: "center" }); }
});

/* Live demand, once there's enough to mean something */
(async () => {
  try {
    const d = await (await fetch("/api/stats")).json();
    if (!d.total || d.total < 15) return;
    const el = $("#demand");
    el.innerHTML = `<h3>This month on HelpYeah</h3><p><b>${d.total} people</b> looked for a functional practitioner${d.unmatched ? `, and <b>${d.unmatched}</b> didn't find a match in their state yet` : ""}.</p>
      ${d.states.length ? `<p>Most searches: ${d.states.map(([s, n]) => `${esc(STATE[s] || s)} (${n})`).join(", ")}.</p>` : ""}
      ${d.concerns.length ? `<p>Top concerns: ${d.concerns.map(([c]) => esc(CONCERN[c] || c)).join(", ")}.</p>` : ""}`;
    el.hidden = false;
  } catch {}
})();

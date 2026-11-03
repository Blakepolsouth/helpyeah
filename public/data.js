/* HelpYeah shared data: used by the pages and by the server functions. */

export const CONCERNS = [
  ["gut", "Gut & digestion"], ["hormones", "Hormones & thyroid"], ["fatigue", "Fatigue & low energy"],
  ["autoimmune", "Autoimmune & inflammation"], ["metabolic", "Weight, metabolism & blood sugar"],
  ["mood", "Stress, sleep & mood"], ["womens", "Women's health & fertility"], ["skin", "Skin issues"],
  ["prevention", "Prevention & feeling my best"]
];
export const CONCERN = Object.fromEntries(CONCERNS);

/* Practitioner types, in plain English. This is the part patients find most confusing. */
export const TYPES = {
  md: { label: "Functional MD / DO", short: "Medical doctor", can: "Can diagnose, order labs and prescribe medication.", good: "Complex or long-running issues, or when you may need medication.", licensed: true },
  nd: { label: "Naturopathic doctor (ND)", short: "Naturopath", can: "Orders labs and uses nutrition, supplements and lifestyle. Prescribing rights vary by state.", good: "A natural-first approach with lab testing.", licensed: true },
  nutrition: { label: "Functional nutritionist / dietitian", short: "Nutrition", can: "Builds a food and supplement plan around your goals. Some order functional labs.", good: "When food is likely a big part of the answer.", licensed: true },
  coach: { label: "Functional health coach", short: "Health coach", can: "Helps you change habits and stick with them. Doesn't diagnose or prescribe.", good: "Accountability and support, often alongside a doctor.", licensed: false }
};

/* What kind of help the patient wants -> which practitioner types fit best */
export const HELP = [
  ["labs-rx", "A doctor who can run labs and prescribe", ["md"]],
  ["natural", "Lab testing with a natural approach", ["nd", "md"]],
  ["food", "A food and nutrition plan", ["nutrition"]],
  ["habits", "Coaching and accountability", ["coach"]],
  ["unsure", "Not sure yet. Help me choose.", ["md", "nd", "nutrition", "coach"]]
];

export const BUDGETS = [
  ["low", "Under $150 for a first visit"], ["mid", "$150 to $350"], ["high", "Over $350 is OK"], ["insurance", "I need it to take insurance"]
];

export const PRICE = { low: "Under $150 first visit", mid: "$150–$350 first visit", high: "$350+ first visit" };
export const INSURANCE = { none: "Self-pay", superbill: "Self-pay, superbill for reimbursement", network: "Takes some insurance" };

export const STATES = [["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["DC","District of Columbia"],["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"]];
export const STATE = Object.fromEntries(STATES);

/* Who can see a patient in a given state.
   Online: they must list the patient's state (coaches may choose "anywhere in the US"). In person: their office is in that state. */
export function canSee(p, a) {
  if (!p.approved || p.accepting === false) return false;
  const online = !!p.online && (p.anywhere || (p.states || []).includes(a.state));
  const inPerson = !!(p.inPerson && p.officeState === a.state);
  if (a.mode === "online") return online;
  if (a.mode === "inperson") return inPerson;
  return online || inPerson;
}

/* Pick up to 3 practitioners. Higher score = better fit. Small daily shuffle so the same people aren't always on top. */
export function match(list, a, daySeed = 0) {
  const want = (HELP.find(h => h[0] === a.help) || HELP[4])[2], unsure = a.help === "unsure";
  const hash = s => { let h = 2166136261 ^ daySeed; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const scored = list.filter(p => canSee(p, a)).map(p => {
    let s = 0;
    if (want.includes(p.type)) s += unsure ? 2 : 6 - want.indexOf(p.type);
    const overlap = (a.concerns || []).filter(c => (p.focus || []).includes(c)).length; s += overlap * 3;
    if (a.budget === "insurance") s += p.insurance === "network" ? 4 : p.insurance === "superbill" ? 1 : -3;
    else if (a.budget && p.price) { const r = { low: 0, mid: 1, high: 2 }; s += r[p.price] <= r[a.budget] ? 2 : -2 * (r[p.price] - r[a.budget]); }
    if (p.freeIntro) s += 0.7;
    s += hash(p.id) * 0.9;
    return { p, s, overlap };
  }).sort((x, y) => y.s - x.s);
  if (!unsure) return scored.slice(0, 3);
  const out = [], seen = new Set();                          // unsure: show different kinds of practitioners
  for (const x of scored) if (!seen.has(x.p.type) && out.length < 3) { out.push(x); seen.add(x.p.type); }
  for (const x of scored) if (out.length < 3 && !out.includes(x)) out.push(x);
  return out;
}

/* What the public sees of a listing (never the email or license numbers) */
export const publicView = p => ({ id: p.id, name: p.name, creds: p.creds, type: p.type, practice: p.practice, photo: p.photo || "", focus: p.focus, approach: p.approach,
  price: p.price, insurance: p.insurance, online: p.online, inPerson: p.inPerson, city: p.city || "", officeState: p.officeState || "", freeIntro: !!p.freeIntro,
  states: p.anywhere ? "anywhere" : (p.states || []) });

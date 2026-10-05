// Shared mod helpers: used by the score table and the playstyle card,
// so both always agree on what counts as which mod and what colour it is.

export const MOD_NAMES = {
  NF: 'No Fail', EZ: 'Easy', HT: 'Half Time (includes Daycore)', HD: 'Hidden',
  HR: 'Hard Rock', DT: 'Double Time (includes Nightcore)', FL: 'Flashlight',
  SD: 'Sudden Death', PF: 'Perfect', SO: 'Spun Out', TD: 'Touch Device',
  MR: 'Mirror', V2: 'Score V2',
};

const MOD_ALIASES = { NC: 'DT', DC: 'HT' };   // Nightcore counts as DT, Daycore as HT
const IGNORED_MODS = new Set(['CL']);          // lazer "Classic" marker, not a gameplay mod
// Mods that don't change difficulty, so a play with only these still counts as NM
const NM_ALLOWED_MODS = new Set(['NF', 'SD', 'PF', 'SO', 'TD', 'MR']);
const MAIN_MODS = new Set(['HD', 'HR', 'DT']);

// Distinct mods on a score, tidied up (no NM, no CL, NC->DT, DC->HT)
export function modsOf(score) {
  const mods = new Set();
  for (const mod of score.mods || []) {
    if (!mod || mod === 'NM' || IGNORED_MODS.has(mod)) continue;
    mods.add(MOD_ALIASES[mod] || mod);
  }
  return [...mods];
}

export function hasMod(score, mod) {
  return modsOf(score).includes(mod);
}

// "No mod" in the playstyle sense: nothing that changes difficulty
export function isNM(score) {
  return modsOf(score).every(mod => NM_ALLOWED_MODS.has(mod));
}

// Anything beyond NM, HD, HR and DT: EZ, HT, FL, and unknown/lazer-only mods
export function isGimmick(score) {
  return modsOf(score).some(mod => !NM_ALLOWED_MODS.has(mod) && !MAIN_MODS.has(mod));
}

export function modMatches(score, key) {
  if (key === 'all') return true;
  if (key === 'NM') return isNM(score);
  return hasMod(score, key);
}

// [{ mod, count }] for every mod that appears, most common first
export function modCounts(scores) {
  const counts = {};
  for (const score of scores) {
    for (const mod of modsOf(score)) counts[mod] = (counts[mod] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([mod, count]) => ({ mod, count }));
}

// Filter chips: All, NM, then every mod that actually appears
export function buildChips(scores) {
  const chips = [{ key: 'all', label: 'All', count: scores.length }];
  const nmCount = scores.filter(isNM).length;
  if (nmCount > 0) chips.push({ key: 'NM', label: 'NM', count: nmCount });
  for (const { mod, count } of modCounts(scores)) chips.push({ key: mod, label: mod, count });
  return chips;
}

// One colour per mod, in three strengths:
//   badge  — mod badges in the score table
//   chip   — selected filter chip
//   bar    — mod breakdown bars on the playstyle card
// Class names are written out in full so Tailwind can find them.
const MOD_COLORS = {
  NM: { badge: 'bg-sky-400/10 text-sky-300 border-sky-400/30',             chip: 'bg-sky-400/25 text-sky-200',         bar: 'bg-sky-400' },
  HD: { badge: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/30',    chip: 'bg-indigo-400/25 text-indigo-200',   bar: 'bg-indigo-400' },
  HR: { badge: 'bg-rose-400/10 text-rose-300 border-rose-400/30',          chip: 'bg-rose-400/25 text-rose-200',       bar: 'bg-rose-400' },
  DT: { badge: 'bg-amber-400/10 text-amber-200 border-amber-300/30',       chip: 'bg-amber-400/25 text-amber-100',     bar: 'bg-amber-400' },
  EZ: { badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30', chip: 'bg-emerald-400/25 text-emerald-200', bar: 'bg-emerald-400' },
  HT: { badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30', chip: 'bg-emerald-400/25 text-emerald-200', bar: 'bg-emerald-400' },
  FL: { badge: 'bg-slate-400/10 text-slate-300 border-slate-400/30',       chip: 'bg-slate-400/25 text-slate-200',     bar: 'bg-slate-300' },
  SD: { badge: 'bg-orange-400/10 text-orange-300 border-orange-400/30',    chip: 'bg-orange-400/25 text-orange-200',   bar: 'bg-orange-400' },
  PF: { badge: 'bg-orange-400/10 text-orange-300 border-orange-400/30',    chip: 'bg-orange-400/25 text-orange-200',   bar: 'bg-orange-400' },
  SO: { badge: 'bg-pink-400/10 text-pink-300 border-pink-400/30',          chip: 'bg-pink-400/25 text-pink-200',       bar: 'bg-pink-400' },
  TD: { badge: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30',          chip: 'bg-cyan-400/25 text-cyan-200',       bar: 'bg-cyan-400' },
  MR: { badge: 'bg-fuchsia-400/10 text-fuchsia-300 border-fuchsia-400/30', chip: 'bg-fuchsia-400/25 text-fuchsia-200', bar: 'bg-fuchsia-400' },
};
const UNKNOWN_MOD_COLORS = { badge: 'bg-gray-400/10 text-gray-300 border-gray-400/30', chip: 'bg-gray-500 text-white', bar: 'bg-gray-400' };

// Colours for a mod; NC and DC use their DT/HT colours
export function modColors(mod) {
  return MOD_COLORS[MOD_ALIASES[mod] || mod] || UNKNOWN_MOD_COLORS;
}

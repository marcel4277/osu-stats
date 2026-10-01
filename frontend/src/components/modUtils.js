// Shared mod helpers: used by the score table filter and the playstyle card,
// so both always agree on what counts as which mod.

export const MOD_NAMES = {
  NF: 'No Fail', EZ: 'Easy', HT: 'Half Time (includes Daycore)', HD: 'Hidden',
  HR: 'Hard Rock', DT: 'Double Time (includes Nightcore)', FL: 'Flashlight',
  SD: 'Sudden Death', PF: 'Perfect', SO: 'Spun Out', TD: 'Touch Device',
  MR: 'Mirror', V2: 'Score V2',
};

const FAMILY = { NC: 'DT', DC: 'HT' };   // Nightcore counts as DT, Daycore as HT
const HIDDEN = new Set(['CL']);           // lazer "Classic" marker, not a gameplay mod
const NM_OK  = new Set(['NF', 'SD', 'PF', 'SO', 'TD', 'MR']); // allowed in a "no mod" play

// Distinct mods on a score, tidied up (no NM, no CL, NC->DT, DC->HT)
export function modsOf(score) {
  const out = new Set();
  for (const m of score.mods || []) {
    if (!m || m === 'NM' || HIDDEN.has(m)) continue;
    out.add(FAMILY[m] || m);
  }
  return [...out];
}

// "No mod" in the playstyle sense: nothing that changes difficulty
export function isNM(score) {
  return modsOf(score).every(m => NM_OK.has(m));
}

export function modMatches(score, key) {
  if (key === 'all') return true;
  if (key === 'NM') return isNM(score);
  return modsOf(score).includes(key);
}

// [{ mod, count }] for every mod that appears, most common first
export function modCounts(scores) {
  const counts = {};
  for (const s of scores) for (const m of modsOf(s)) counts[m] = (counts[m] || 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([mod, count]) => ({ mod, count }));
}

// Filter chips: All, NM, then every mod that actually appears
export function buildChips(scores) {
  const chips = [{ key: 'all', label: 'All', count: scores.length }];
  const nm = scores.filter(isNM).length;
  if (nm > 0) chips.push({ key: 'NM', label: 'NM', count: nm });
  for (const { mod, count } of modCounts(scores)) chips.push({ key: mod, label: mod, count });
  return chips;
}

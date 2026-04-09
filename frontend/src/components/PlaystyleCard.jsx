import { useMemo, useState } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ children, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`w-7 h-7 ${className}`}>
      {children}
    </svg>
  );
}

// One icon per mod family, shared across tiers
const FAMILY_ICONS = {
  nm:         <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>,
  hr:         <Icon><circle cx="12" cy="12" r="5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></Icon>,
  dt:         <Icon><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Icon>,
  hd:         <Icon><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></Icon>,
  gimmick:    <Icon><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>,
  allrounder: <Icon><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></Icon>,
};

function archetypeIcon(key) {
  if (key.startsWith('nm'))   return FAMILY_ICONS.nm;
  if (key.startsWith('hr'))   return FAMILY_ICONS.hr;
  if (key.startsWith('dt'))   return FAMILY_ICONS.dt;
  if (key.startsWith('hd'))   return FAMILY_ICONS.hd;
  if (key === 'gimmick')      return FAMILY_ICONS.gimmick;
  return FAMILY_ICONS.allrounder;
}

// ─── Archetypes ───────────────────────────────────────────────────────────────

const ARCHETYPES = {
  // NM family
  nmPlayer: {
    label: 'NM Player',
    desc: 'Prefers to play clean, without mods. Comfortable across a wide range of maps.',
    criteria: 'NM on 70%+ of scores',
    from: 'from-sky-700', to: 'to-cyan-500',
    text: 'text-cyan-300', border: 'border-cyan-600',
  },
  nmSpecialist: {
    label: 'NM Specialist',
    desc: 'Almost exclusively plays nomod. A dedicated raw player with a strong preference for clean maps.',
    criteria: 'NM on 90%+ of scores',
    from: 'from-sky-600', to: 'to-cyan-400',
    text: 'text-cyan-200', border: 'border-cyan-500',
  },
  nmParagon: {
    label: 'NM Paragon',
    desc: 'Plays almost entirely nomod and does it with exceptional accuracy. The gold standard of clean play.',
    criteria: 'NM on 90%+ of scores AND avg accuracy ≥ 99%',
    from: 'from-cyan-500', to: 'to-teal-300',
    text: 'text-teal-100', border: 'border-teal-400',
  },

  // HR family
  hrPlayer: {
    label: 'HR Player',
    desc: 'Hard Rock is a regular part of the mod pool. Comfortable reading tighter approach rates.',
    criteria: 'HR on 40%+ of scores',
    from: 'from-rose-800', to: 'to-red-500',
    text: 'text-rose-300', border: 'border-rose-600',
  },
  hrSpecialist: {
    label: 'HR Specialist',
    desc: 'Hard Rock is the go-to mod. Consistently challenges high approach rates across their top plays.',
    criteria: 'HR on 60%+ of scores',
    from: 'from-rose-700', to: 'to-pink-500',
    text: 'text-rose-200', border: 'border-rose-500',
  },
  hrParagon: {
    label: 'HR Paragon',
    desc: 'Plays HR at a high rate and maintains elite accuracy doing it. Reading and precision at their peak.',
    criteria: 'HR on 60%+ of scores AND avg accuracy ≥ 97%',
    from: 'from-rose-600', to: 'to-fuchsia-400',
    text: 'text-fuchsia-100', border: 'border-fuchsia-500',
  },

  // DT family
  dtPlayer: {
    label: 'DT Player',
    desc: 'Double Time features heavily in their top plays. Comfortable at elevated BPM.',
    criteria: 'DT on 50%+ of scores',
    from: 'from-yellow-700', to: 'to-orange-500',
    text: 'text-yellow-200', border: 'border-yellow-600',
  },
  dtSpecialist: {
    label: 'DT Specialist',
    desc: 'Speed is the main focus. The majority of top plays are set under Double Time.',
    criteria: 'DT on 70%+ of scores',
    from: 'from-yellow-600', to: 'to-amber-400',
    text: 'text-yellow-100', border: 'border-amber-500',
  },
  dtParagon: {
    label: 'DT Paragon',
    desc: 'Plays DT at high volume and keeps accuracy in check. Speed and precision combined.',
    criteria: 'DT on 70%+ of scores AND avg accuracy ≥ 97%',
    from: 'from-amber-500', to: 'to-yellow-300',
    text: 'text-amber-100', border: 'border-yellow-400',
  },

  // HD family
  hdPlayer: {
    label: 'HD Player',
    desc: 'Hidden is their mod of choice without stacking HR or DT. A reading-focused playstyle.',
    criteria: 'Pure HD on 50%+ of scores',
    from: 'from-indigo-800', to: 'to-purple-500',
    text: 'text-indigo-200', border: 'border-indigo-600',
  },
  hdSpecialist: {
    label: 'HD Specialist',
    desc: 'Almost all top plays are under Hidden. Reads approach circles purely from memory and flow.',
    criteria: 'Pure HD on 70%+ of scores',
    from: 'from-indigo-700', to: 'to-violet-400',
    text: 'text-violet-200', border: 'border-violet-500',
  },
  hdParagon: {
    label: 'HD Paragon',
    desc: 'Plays Hidden at an elite level with exceptional accuracy. Mastery of reading under pressure.',
    criteria: 'Pure HD on 70%+ of scores AND avg accuracy ≥ 98%',
    from: 'from-violet-600', to: 'to-indigo-300',
    text: 'text-violet-100', border: 'border-violet-400',
  },

  // Gimmick
  gimmick: {
    label: 'Gimmick Player',
    desc: 'A significant portion of top plays use non-standard mods like EZ, HT, or FL. Unconventional but effective.',
    criteria: 'EZ / HT / FL or unknown mods on 10%+ of scores',
    from: 'from-green-700', to: 'to-teal-400',
    text: 'text-green-200', border: 'border-green-600',
  },

  // Fallback
  allrounder: {
    label: 'All-Rounder',
    desc: 'No single mod dominates the top plays. Comfortable across multiple playstyles without a clear specialisation.',
    criteria: 'No single mod exceeds its Player threshold',
    from: 'from-slate-700', to: 'to-violet-500',
    text: 'text-slate-200', border: 'border-slate-500',
  },
};

// ─── Trait badges ─────────────────────────────────────────────────────────────

const TRAITS = {
  accMachine:   { label: 'Acc Machine',    title: 'Exceptionally high average accuracy',            criteria: 'Avg accuracy ≥ 99% (non-Paragon)',      style: 'bg-emerald-900 text-emerald-300' },
  hdStacker:    { label: 'HD Stacker',     title: 'Regularly adds Hidden on top of other mods',     criteria: 'HD on 30%+ of scores (not primary mod)', style: 'bg-indigo-900  text-indigo-300'  },
  hdhrStacker:  { label: 'HDHR Stacker',   title: 'Frequently combines Hidden and Hard Rock',       criteria: 'HDHR on 20%+ of scores',                style: 'bg-fuchsia-900 text-fuchsia-300' },
  hddtStacker:  { label: 'HDDT Stacker',   title: 'Frequently combines Hidden and Double Time',     criteria: 'HDDT on 20%+ of scores',                style: 'bg-amber-900   text-amber-300'   },
  modMixer:     { label: 'Mod Mixer',      title: 'No single mod dominates — plays a varied pool',  criteria: 'No mod above 50% (All-Rounder only)',    style: 'bg-slate-700   text-slate-300'   },
  gimmickTouch: { label: 'Gimmick Touch',  title: 'Occasionally dips into non-standard mods',      criteria: 'EZ / HT / FL on 5–10% of scores',       style: 'bg-green-900   text-green-300'   },
};

// ─── Analyse ──────────────────────────────────────────────────────────────────

const GIMMICK_MODS  = new Set(['EZ', 'HT', 'FL']);
const STANDARD_MODS = new Set(['NF', 'HD', 'HR', 'DT', 'NC', 'SD', 'PF', 'SO', 'TD', 'MR']);

function analyse(scores) {
  const total = scores.length;

  const hasDT      = s => s.mods.some(m => m === 'DT' || m === 'NC');
  const hasHR      = s => s.mods.includes('HR');
  const hasHD      = s => s.mods.includes('HD');
  const hasGimmick = s => s.mods.some(m => GIMMICK_MODS.has(m) || (!STANDARD_MODS.has(m) && m !== 'NM' && m !== ''));

  // NM: no HR, DT, HD, or gimmick mods
  const isNM     = s => !hasDT(s) && !hasHR(s) && !hasHD(s) && !hasGimmick(s);
  // Pure HD: HD without HR or DT stacked (HDHR counts as HR, HDDT counts as DT)
  const isPureHD = s => hasHD(s) && !hasHR(s) && !hasDT(s);

  const nmCount      = scores.filter(isNM).length;
  const hrCount      = scores.filter(hasHR).length;
  const dtCount      = scores.filter(hasDT).length;
  const pureHDCount  = scores.filter(isPureHD).length;
  const allHDCount   = scores.filter(hasHD).length;
  const hdhrCount    = scores.filter(s => hasHD(s) && hasHR(s)).length;
  const hddtCount    = scores.filter(s => hasHD(s) && hasDT(s)).length;
  const gimmickCount = scores.filter(hasGimmick).length;

  const nmR      = nmCount      / total;
  const hrR      = hrCount      / total;
  const dtR      = dtCount      / total;
  const pureHDR  = pureHDCount  / total;
  const allHDR   = allHDCount   / total;
  const hdhrR    = hdhrCount    / total;
  const hddtR    = hddtCount    / total;
  const gimmickR = gimmickCount / total;

  const avgAcc = scores.reduce((sum, s) => sum + parseFloat(s.accuracy), 0) / total;

  // Gimmick archetype takes priority if significant
  let key;
  if (gimmickR >= 0.10) {
    key = 'gimmick';
  } else {
    // Each mod with its player/specialist thresholds and paragon acc requirement
    const candidates = [
      { prefix: 'nm', rate: nmR,     playerT: 0.70, specialistT: 0.90, paragonAcc: 99.0 },
      { prefix: 'hr', rate: hrR,     playerT: 0.40, specialistT: 0.60, paragonAcc: 97.0 },
      { prefix: 'dt', rate: dtR,     playerT: 0.50, specialistT: 0.70, paragonAcc: 97.0 },
      { prefix: 'hd', rate: pureHDR, playerT: 0.50, specialistT: 0.70, paragonAcc: 98.0 },
    ];

    // Sort by rate descending, pick the dominant mod that meets its Player threshold
    const sorted = [...candidates].sort((a, b) => b.rate - a.rate);
    const match  = sorted.find(c => c.rate >= c.playerT);

    if (!match) {
      key = 'allrounder';
    } else if (match.rate >= match.specialistT && avgAcc >= match.paragonAcc) {
      key = `${match.prefix}Paragon`;
    } else if (match.rate >= match.specialistT) {
      key = `${match.prefix}Specialist`;
    } else {
      key = `${match.prefix}Player`;
    }
  }

  // Trait badges
  const traits = [];
  const isParagon = key.endsWith('Paragon');
  const isHDarch  = key.startsWith('hd');

  if (avgAcc >= 99.0 && !isParagon)                      traits.push('accMachine');
  if (allHDR >= 0.30 && !isHDarch)                       traits.push('hdStacker');
  if (hdhrR  >= 0.20)                                    traits.push('hdhrStacker');
  if (hddtR  >= 0.20)                                    traits.push('hddtStacker');
  if (key === 'allrounder' && Math.max(nmR, hrR, dtR, pureHDR) < 0.50) traits.push('modMixer');
  if (gimmickR >= 0.05 && gimmickR < 0.10)               traits.push('gimmickTouch');

  const breakdown = [
    { mod: 'NM', count: nmCount,    color: 'bg-gray-400'   },
    { mod: 'HR', count: hrCount,    color: 'bg-rose-400'   },
    { mod: 'DT', count: dtCount,    color: 'bg-yellow-400' },
    { mod: 'HD', count: allHDCount, color: 'bg-indigo-400' },
  ].filter(b => b.count > 0);

  return { key, traits, breakdown, total, avgAcc };
}

// ─── Archetypes modal ─────────────────────────────────────────────────────────

const MOD_GROUPS = [
  { label: 'Nomod',       keys: ['nmPlayer', 'nmSpecialist', 'nmParagon'] },
  { label: 'Hard Rock',   keys: ['hrPlayer', 'hrSpecialist', 'hrParagon'] },
  { label: 'Double Time', keys: ['dtPlayer', 'dtSpecialist', 'dtParagon'] },
  { label: 'Hidden',      keys: ['hdPlayer', 'hdSpecialist', 'hdParagon'] },
  { label: 'Other',       keys: ['gimmick', 'allrounder'] },
];

function ArchetypesModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-white font-bold text-lg">All Playstyle Archetypes</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-400 text-sm">
            Archetypes are based on your most-played mod across your top scores.
            The highest tier you qualify for within that mod is shown.
            Paragon tiers add an accuracy requirement on top.
          </p>

          {MOD_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">{group.label}</p>
              <div className="space-y-2">
                {group.keys.map(k => {
                  const a = ARCHETYPES[k];
                  return (
                    <div key={k} className={`flex items-start gap-3 rounded-lg p-3 border ${a.border} bg-gray-800`}>
                      <div className={`shrink-0 mt-0.5 ${a.text}`}>{archetypeIcon(k)}</div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm ${a.text}`}>{a.label}</p>
                        <p className="text-gray-300 text-xs mt-0.5">{a.desc}</p>
                        <p className="text-gray-500 text-xs mt-1 font-mono">{a.criteria}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Secondary Traits</p>
            <div className="space-y-2">
              {Object.values(TRAITS).map(t => (
                <div key={t.label} className="flex items-start gap-3 rounded-lg p-3 bg-gray-800 border border-gray-700">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5 ${t.style}`}>{t.label}</span>
                  <div className="min-w-0">
                    <p className="text-gray-300 text-xs">{t.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-mono">{t.criteria}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-500 text-xs text-center">
            HDHR scores count toward HR. HDDT scores count toward DT. Pure HD is tracked separately.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlaystyleCard({ scores }) {
  const [showModal, setShowModal] = useState(false);

  const result = useMemo(() => {
    if (!scores || scores.length === 0) return null;
    return analyse(scores);
  }, [scores]);

  if (!result) return null;

  const { key, traits, breakdown, total, avgAcc } = result;
  const a = ARCHETYPES[key];

  return (
    <>
      <div className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden`}>

        <div className={`border-l-4 ${a.border} bg-gray-900 px-5 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={a.text}>{archetypeIcon(key)}</div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Playstyle</p>
              <h3 className={`text-xl font-bold leading-tight ${a.text}`}>{a.label}</h3>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-gray-500 text-xs">Avg accuracy</p>
              <p className="text-white font-bold text-lg">{avgAcc.toFixed(1)}%</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 transition text-gray-400 hover:text-white text-xs font-bold leading-none flex items-center justify-center shrink-0 mt-0.5"
              title="View all archetypes"
            >
              ?
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className={`text-sm mb-5 ${a.text}`}>{a.desc}</p>

          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Mod breakdown · {total} scores</p>
          <div className="space-y-2 mb-5">
            {breakdown.map(({ mod, count, color }) => (
              <div key={mod} className="flex items-center gap-3">
                <span className="text-gray-400 text-xs w-8 shrink-0">{mod}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-700`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-xs w-16 text-right shrink-0">
                  {count} <span className="text-gray-600">({Math.round((count / total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>

          {traits.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-gray-700 pt-4">
              {traits.map(k => (
                <span key={k} title={TRAITS[k].title}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${TRAITS[k].style}`}>
                  {TRAITS[k].label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && <ArchetypesModal onClose={() => setShowModal(false)} />}
    </>
  );
}

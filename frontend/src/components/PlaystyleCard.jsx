import { useEffect, useMemo, useRef, useState } from 'react';
import { modCounts, hasMod, isNM, isGimmick, modColors } from './modUtils.js';
import Tooltip from './Tooltip.jsx';

// Icons

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

// Archetypes

const ARCHETYPES = {
  // NM family
  nmPlayer: {
    label: 'NM Player',
    desc: 'Mostly plays without mods.',
    criteria: 'NM on 70%+ of top plays',
    text: 'text-cyan-300', border: 'border-cyan-600',
  },
  nmSpecialist: {
    label: 'NM Specialist',
    desc: 'Almost only plays nomod.',
    criteria: 'NM on 90%+ of top plays',
    text: 'text-cyan-200', border: 'border-cyan-500',
  },
  nmParagon: {
    label: 'NM Paragon',
    desc: 'Nomod with exceptional accuracy.',
    criteria: 'NM on 90%+ of top plays AND avg accuracy ≥ 99%',
    text: 'text-teal-100', border: 'border-teal-400',
  },

  // HR family
  hrPlayer: {
    label: 'HR Player',
    desc: 'Hard Rock is a regular pick.',
    criteria: 'HR on 40%+ of top plays',
    text: 'text-rose-300', border: 'border-rose-600',
  },
  hrSpecialist: {
    label: 'HR Specialist',
    desc: 'Hard Rock is the go-to mod.',
    criteria: 'HR on 60%+ of top plays',
    text: 'text-rose-200', border: 'border-rose-500',
  },
  hrParagon: {
    label: 'HR Paragon',
    desc: 'Lots of HR with elite accuracy.',
    criteria: 'HR on 60%+ of top plays AND avg accuracy ≥ 97%',
    text: 'text-fuchsia-100', border: 'border-fuchsia-500',
  },

  // DT family
  dtPlayer: {
    label: 'DT Player',
    desc: 'Double Time features heavily.',
    criteria: 'DT on 50%+ of top plays',
    text: 'text-yellow-200', border: 'border-yellow-600',
  },
  dtSpecialist: {
    label: 'DT Specialist',
    desc: 'Most top plays are on DT.',
    criteria: 'DT on 70%+ of top plays',
    text: 'text-yellow-100', border: 'border-amber-500',
  },
  dtParagon: {
    label: 'DT Paragon',
    desc: 'Lots of DT with high accuracy.',
    criteria: 'DT on 70%+ of top plays AND avg accuracy ≥ 97%',
    text: 'text-amber-100', border: 'border-yellow-400',
  },

  // HD family
  hdPlayer: {
    label: 'HD Player',
    desc: 'Hidden on its own is the mod of choice.',
    criteria: 'Pure HD on 50%+ of top plays',
    text: 'text-indigo-200', border: 'border-indigo-600',
  },
  hdSpecialist: {
    label: 'HD Specialist',
    desc: 'Almost all top plays are HD.',
    criteria: 'Pure HD on 70%+ of top plays',
    text: 'text-violet-200', border: 'border-violet-500',
  },
  hdParagon: {
    label: 'HD Paragon',
    desc: 'Hidden with exceptional accuracy.',
    criteria: 'Pure HD on 70%+ of top plays AND avg accuracy ≥ 98%',
    text: 'text-violet-100', border: 'border-violet-400',
  },

  // Gimmick
  gimmick: {
    label: 'Gimmick Player',
    desc: 'Often uses EZ, HT or FL.',
    criteria: 'EZ / HT / FL or unknown mods on 10%+ of top plays',
    text: 'text-green-200', border: 'border-green-600',
  },

  // Fallback
  allrounder: {
    label: 'All-Rounder',
    desc: 'No single mod dominates.',
    criteria: 'No single mod exceeds its Player threshold',
    text: 'text-slate-200', border: 'border-slate-500',
  },
};

// Trait badges. Each has its own colour so a badge matches its entry in the
// archetypes popup; mod-based traits use that mod's colour from modUtils (HD
// indigo, HR rose, DT amber, EZ/HT green). Drawn as muted tinted outlines,
// like the mod badges, so they don't shout.

const TRAITS = {
  accMachine:   { label: 'Acc Machine',    title: 'Exceptionally high average accuracy',            criteria: 'Avg accuracy ≥ 99% (non-Paragon)',          style: 'bg-green-400/10 text-green-300 border-green-400/30' },
  hdStacker:    { label: 'HD Stacker',     title: 'Regularly adds Hidden on top of other mods',     criteria: 'HD on 30%+ of top plays (not primary mod)', style: modColors('HD').badge },
  hdhrStacker:  { label: 'HDHR Stacker',   title: 'Frequently combines Hidden and Hard Rock',       criteria: 'HDHR on 20%+ of top plays',                 style: modColors('HR').badge },
  hddtStacker:  { label: 'HDDT Stacker',   title: 'Frequently combines Hidden and Double Time',     criteria: 'HDDT on 20%+ of top plays',                 style: modColors('DT').badge },
  modMixer:     { label: 'Mod Mixer',      title: 'No single mod dominates — plays a varied pool',  criteria: 'No mod above 50% (All-Rounder only)',       style: 'bg-slate-400/10 text-slate-300 border-slate-400/30' },
  gimmickTouch: { label: 'Gimmick Touch',  title: 'Occasionally dips into non-standard mods',      criteria: 'EZ / HT / FL on 5–10% of top plays',        style: modColors('EZ').badge },
};

// Analyse

function analyse(scores) {
  const total = scores.length;

  const hasDT      = s => hasMod(s, 'DT');
  const hasHR      = s => hasMod(s, 'HR');
  const hasHD      = s => hasMod(s, 'HD');

  // Pure HD: HD without HR or DT stacked (HDHR counts as HR, HDDT counts as DT)
  const isPureHD = s => hasHD(s) && !hasHR(s) && !hasDT(s);

  const nmCount      = scores.filter(isNM).length;
  const hrCount      = scores.filter(hasHR).length;
  const dtCount      = scores.filter(hasDT).length;
  const pureHDCount  = scores.filter(isPureHD).length;
  const allHDCount   = scores.filter(hasHD).length;
  const hdhrCount    = scores.filter(s => hasHD(s) && hasHR(s)).length;
  const hddtCount    = scores.filter(s => hasHD(s) && hasDT(s)).length;
  const gimmickCount = scores.filter(isGimmick).length;

  const nmRate       = nmCount      / total;
  const hrRate       = hrCount      / total;
  const dtRate       = dtCount      / total;
  const pureHDRate   = pureHDCount  / total;
  const allHDRate    = allHDCount   / total;
  const hdhrRate     = hdhrCount    / total;
  const hddtRate     = hddtCount    / total;
  const gimmickRate  = gimmickCount / total;

  const avgAccuracy = scores.reduce((sum, s) => sum + parseFloat(s.accuracy), 0) / total;

  // Gimmick archetype takes priority if significant
  let key;
  if (gimmickRate >= 0.10) {
    key = 'gimmick';
  } else {
    // Each mod with its player/specialist thresholds and paragon acc requirement
    const candidates = [
      { prefix: 'nm', rate: nmRate,     playerMin: 0.70, specialistMin: 0.90, paragonAcc: 99.0 },
      { prefix: 'hr', rate: hrRate,     playerMin: 0.40, specialistMin: 0.60, paragonAcc: 97.0 },
      { prefix: 'dt', rate: dtRate,     playerMin: 0.50, specialistMin: 0.70, paragonAcc: 97.0 },
      { prefix: 'hd', rate: pureHDRate, playerMin: 0.50, specialistMin: 0.70, paragonAcc: 98.0 },
    ];

    // Sort by rate descending, pick the dominant mod that meets its Player threshold
    const sorted = [...candidates].sort((a, b) => b.rate - a.rate);
    const match  = sorted.find(c => c.rate >= c.playerMin);

    if (!match) {
      key = 'allrounder';
    } else if (match.rate >= match.specialistMin && avgAccuracy >= match.paragonAcc) {
      key = `${match.prefix}Paragon`;
    } else if (match.rate >= match.specialistMin) {
      key = `${match.prefix}Specialist`;
    } else {
      key = `${match.prefix}Player`;
    }
  }

  // Trait badges
  const traits = [];
  const isParagon     = key.endsWith('Paragon');
  const isHDArchetype = key.startsWith('hd');

  if (avgAccuracy >= 99.0 && !isParagon)          traits.push('accMachine');
  if (allHDRate >= 0.30 && !isHDArchetype)        traits.push('hdStacker');
  if (hdhrRate >= 0.20)                           traits.push('hdhrStacker');
  if (hddtRate >= 0.20)                           traits.push('hddtStacker');
  if (key === 'allrounder' && Math.max(nmRate, hrRate, dtRate, pureHDRate) < 0.50) traits.push('modMixer');
  if (gimmickRate >= 0.05 && gimmickRate < 0.10)  traits.push('gimmickTouch');

  // Every mod that appears in the scores, most common first (NM always first)
  const breakdown = [
    { mod: 'NM', count: nmCount, color: modColors('NM').bar },
    ...modCounts(scores).map(({ mod, count }) => ({ mod, count, color: modColors(mod).bar })),
  ].filter(b => b.count > 0);

  return { key, traits, breakdown, total, avgAccuracy };
}

// Archetypes modal

const MOD_GROUPS = [
  { label: 'Nomod',       keys: ['nmPlayer', 'nmSpecialist', 'nmParagon'] },
  { label: 'Hard Rock',   keys: ['hrPlayer', 'hrSpecialist', 'hrParagon'] },
  { label: 'Double Time', keys: ['dtPlayer', 'dtSpecialist', 'dtParagon'] },
  { label: 'Hidden',      keys: ['hdPlayer', 'hdSpecialist', 'hdParagon'] },
  { label: 'Other',       keys: ['gimmick', 'allrounder'] },
];

function ArchetypesModal({ onClose }) {
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Escape closes the popup; focus starts on the close button so keyboard
  // users land inside it, and returns to whatever opened it afterwards.
  // Runs once on open (onClose is read through a ref so re-renders don't re-run it).
  useEffect(() => {
    const opener = document.activeElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="archetypes-title"
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 id="archetypes-title" className="text-white font-bold text-lg">All Playstyle Archetypes</h2>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white transition text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-400 text-sm">
            Archetypes are based on the player's most-played mod across their top plays.
            The highest tier they qualify for within that mod is shown.
            Paragon tiers add an accuracy requirement on top.
          </p>

          {MOD_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">{group.label}</p>
              <div className="space-y-2">
                {group.keys.map(archetypeKey => {
                  const archetype = ARCHETYPES[archetypeKey];
                  return (
                    <div key={archetypeKey} className={`flex items-start gap-3 rounded-lg p-3 border ${archetype.border} bg-gray-800`}>
                      <div className={`shrink-0 mt-0.5 ${archetype.text}`}>{archetypeIcon(archetypeKey)}</div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm ${archetype.text}`}>{archetype.label}</p>
                        <p className="text-gray-300 text-xs mt-0.5">{archetype.desc}</p>
                        <p className="text-gray-400 text-xs mt-1 font-mono">{archetype.criteria}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Secondary Traits</p>
            <div className="space-y-2">
              {Object.values(TRAITS).map(t => (
                <div key={t.label} className="flex items-start gap-3 rounded-lg p-3 bg-gray-800 border border-gray-700">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 mt-0.5 ${t.style}`}>{t.label}</span>
                  <div className="min-w-0">
                    <p className="text-gray-300 text-xs">{t.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 font-mono">{t.criteria}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-400 text-xs text-center">
            HDHR plays count toward HR. HDDT plays count toward DT. Pure HD is tracked separately.
          </p>
        </div>
      </div>
    </div>
  );
}

// Component

export default function PlaystyleCard({ scores }) {
  const [showModal, setShowModal] = useState(false);

  const result = useMemo(() => {
    if (!scores || scores.length === 0) return null;
    return analyse(scores);
  }, [scores]);

  if (!result) return null;

  const { key, traits, breakdown, total, avgAccuracy } = result;
  const archetype = ARCHETYPES[key];

  return (
    <>
      <div className="flex flex-col bg-gray-800 rounded-lg border border-gray-700">

        {/* The archetype's colour is carried by the icon ring and the title only;
            a colour wash behind the header turned muddy with warm colours. */}
        <div className="relative bg-gray-900 px-5 py-5 rounded-t-lg">
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`shrink-0 w-14 h-14 rounded-full border ${archetype.border} bg-gray-900/70 flex items-center justify-center ${archetype.text}`}>
                {archetypeIcon(key)}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-400 uppercase tracking-widest font-medium">Playstyle</p>
                <h3 className={`text-3xl font-extrabold leading-tight ${archetype.text}`}>{archetype.label}</h3>
                <p className="text-sm text-gray-400 mt-0.5 font-mono">{archetype.criteria}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 shrink-0">
              <div className="text-right">
                <p className="text-gray-300 text-xs uppercase tracking-wider">Avg accuracy</p>
                <p className="text-white font-bold text-lg">{avgAccuracy.toFixed(1)}%</p>
              </div>
              <Tooltip text="View all archetypes" placement="left" focusable={false} className="shrink-0 mt-0.5">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 transition text-gray-400 hover:text-white text-sm font-bold leading-none flex items-center justify-center"
                  aria-label="View all archetypes"
                >
                  ?
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-5">
          <p className="text-sm text-gray-300 mb-4">{archetype.desc}</p>

          <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Mod breakdown · {total} top plays</p>
          <div className="space-y-2">
            {breakdown.map(({ mod, count, color }) => (
              <div key={mod} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-8 shrink-0">{mod}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-700`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-24 text-right shrink-0 whitespace-nowrap">
                  {count} <span className="text-gray-400">({Math.round((count / total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>

          {/* mt-auto: pinned to the bottom, so in the comparison view both
              players' trait rows line up */}
          {traits.length > 0 && (
            <div className="mt-auto pt-5">
            <div className="flex flex-wrap gap-2 border-t border-gray-700 pt-4">
              {traits.map(traitKey => (
                <Tooltip key={traitKey} text={TRAITS[traitKey].title} placement="top-start"
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${TRAITS[traitKey].style}`}>
                  {TRAITS[traitKey].label}
                </Tooltip>
              ))}
            </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <ArchetypesModal onClose={() => setShowModal(false)} />}
    </>
  );
}

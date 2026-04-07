import { useMemo, useState } from 'react';

// ─── Archetypes ───────────────────────────────────────────────────────────────

const ARCHETYPES = {
  hdhrPurist: {
    label: 'HDHR Purist',
    icon: '👁️',
    desc: 'Almost exclusively plays HD+HR. Extreme reading skill and precision.',
    criteria: 'HD on 55%+ of scores AND HDHR on 40%+ of scores',
    from: 'from-rose-700', to: 'to-pink-400',
    text: 'text-rose-300', border: 'border-rose-500',
  },
  precisionReader: {
    label: 'Precision Reader',
    icon: '🎯',
    desc: 'High-accuracy HR player. Reads hard approach rates without losing accuracy.',
    criteria: 'HR on 45%+ of scores AND avg accuracy ≥ 98%',
    from: 'from-rose-600', to: 'to-fuchsia-400',
    text: 'text-fuchsia-300', border: 'border-fuchsia-500',
  },
  aimPlayer: {
    label: 'Aim Player',
    icon: '🏹',
    desc: 'Jump-heavy maps and HR reading. Values cursor control above all.',
    criteria: 'HR on 25%+ of scores',
    from: 'from-pink-600', to: 'to-purple-400',
    text: 'text-pink-300', border: 'border-pink-500',
  },
  speedDemon: {
    label: 'Speed Demon',
    icon: '⚡',
    desc: 'Double Time is the default. Lives for fast maps and high BPM.',
    criteria: 'DT on 55%+ of scores',
    from: 'from-yellow-500', to: 'to-orange-400',
    text: 'text-yellow-200', border: 'border-yellow-500',
  },
  hybridSpeed: {
    label: 'Hybrid Speedaimer',
    icon: '🔀',
    desc: 'Splits time between DT speed runs and clean NM aim maps. Versatile.',
    criteria: 'DT on 20%+ of scores AND NM on 35%+ of scores',
    from: 'from-orange-500', to: 'to-yellow-300',
    text: 'text-orange-200', border: 'border-orange-400',
  },
  neatNomod: {
    label: 'Nomod Specialist',
    icon: '🧼',
    desc: 'Plays raw, no crutch mods. High accuracy on NM maps. Technically clean.',
    criteria: 'NM on 75%+ of scores AND avg accuracy ≥ 97%',
    from: 'from-sky-600', to: 'to-cyan-400',
    text: 'text-sky-200', border: 'border-sky-400',
  },
  techWizard: {
    label: 'Tech Wizard',
    icon: '🔧',
    desc: 'Complex patterns and awkward rhythms. Accuracy suffers, skill compensates.',
    criteria: 'NM on 65%+ of scores AND avg accuracy < 97%',
    from: 'from-blue-700', to: 'to-indigo-400',
    text: 'text-blue-200', border: 'border-blue-500',
  },
  consistency: {
    label: 'Consistency King',
    icon: '💎',
    desc: 'Relentlessly high accuracy across a mixed mod pool.',
    criteria: 'Avg accuracy ≥ 98% (mixed mod pool)',
    from: 'from-emerald-600', to: 'to-teal-400',
    text: 'text-emerald-200', border: 'border-emerald-500',
  },
  allrounder: {
    label: 'All-Rounder',
    icon: '🎮',
    desc: 'No clear mod preference or dominant skill. Comfortable across styles.',
    criteria: 'Does not meet any specific archetype threshold',
    from: 'from-violet-600', to: 'to-cyan-400',
    text: 'text-violet-200', border: 'border-violet-400',
  },
};

// ─── Trait badges ─────────────────────────────────────────────────────────────

const TRAITS = {
  hidden:     { label: 'HD Player',      title: 'Uses Hidden on the majority of plays',         criteria: 'HD on 50%+ of scores',                   style: 'bg-slate-700   text-slate-200'   },
  hrReader:   { label: 'HR Reader',      title: 'Regularly reads Hard Rock approach rates',     criteria: 'HR on 25%+ of scores',                   style: 'bg-rose-900    text-rose-300'    },
  dtLover:    { label: 'DT Enjoyer',     title: 'Frequently uses Double Time',                  criteria: 'DT on 20%+ of scores',                   style: 'bg-yellow-900  text-yellow-300'  },
  purist:     { label: 'Nomod Purist',   title: 'Plays almost exclusively without mods',        criteria: 'NM on 75%+ of scores',                   style: 'bg-sky-900     text-sky-300'     },
  accMachine: { label: 'Acc Machine',    title: 'Maintains unusually high average accuracy',    criteria: 'Avg accuracy > 98.5%',                   style: 'bg-emerald-900 text-emerald-300' },
  modStacker: { label: 'Mod Stacker',    title: 'Frequently combines multiple difficulty mods', criteria: 'HDHR on 30%+ of scores',                 style: 'bg-purple-900  text-purple-300'  },
  bareHands:  { label: 'No Mods At All', title: 'Rarely if ever touches HD, HR, or DT',        criteria: 'Truly no mods on 70%+ of scores',        style: 'bg-gray-700    text-gray-300'    },
};

// ─── Analyse ──────────────────────────────────────────────────────────────────

function analyse(scores) {
  const total = scores.length;
  const hasDT   = s => s.mods.includes('DT') || s.mods.includes('NC');
  const hasHR   = s => s.mods.includes('HR');
  const hasHD   = s => s.mods.includes('HD');
  const hasHDHR = s => hasHD(s) && hasHR(s);
  const isNomod = s => !hasDT(s) && !hasHR(s);

  const dtCount   = scores.filter(hasDT).length;
  const hrCount   = scores.filter(hasHR).length;
  const hdCount   = scores.filter(hasHD).length;
  const hdhrCount = scores.filter(hasHDHR).length;
  const nmCount   = scores.filter(isNomod).length;
  const bareCount = scores.filter(s => s.mods.length === 0).length;

  const dtR   = dtCount   / total;
  const hrR   = hrCount   / total;
  const hdR   = hdCount   / total;
  const hdhrR = hdhrCount / total;
  const nmR   = nmCount   / total;
  const bareR = bareCount / total;

  const avgAcc = scores.reduce((sum, s) => sum + parseFloat(s.accuracy), 0) / total;

  let key;
  if      (hdR  >= 0.55 && hdhrR >= 0.40)           key = 'hdhrPurist';
  else if (hrR  >= 0.45 && avgAcc >= 98.0)           key = 'precisionReader';
  else if (hrR  >= 0.25)                             key = 'aimPlayer';
  else if (dtR  >= 0.55)                             key = 'speedDemon';
  else if (dtR  >= 0.20 && nmR   >= 0.35)            key = 'hybridSpeed';
  else if (nmR  >= 0.75 && avgAcc >= 97.0)           key = 'neatNomod';
  else if (nmR  >= 0.65 && avgAcc <  97.0)           key = 'techWizard';
  else if (avgAcc >= 98.0)                           key = 'consistency';
  else                                               key = 'allrounder';

  const traits = [];
  if (hdR   > 0.50 && key !== 'hdhrPurist')                                                               traits.push('hidden');
  if (hrR   > 0.25 && key !== 'hdhrPurist' && key !== 'precisionReader' && key !== 'aimPlayer')           traits.push('hrReader');
  if (dtR   > 0.20 && key !== 'speedDemon' && key !== 'hybridSpeed')                                      traits.push('dtLover');
  if (nmR   > 0.75 && key !== 'neatNomod'  && key !== 'techWizard')                                       traits.push('purist');
  if (avgAcc > 98.5 && key !== 'hdhrPurist' && key !== 'precisionReader' && key !== 'consistency')        traits.push('accMachine');
  if (hdhrR > 0.30 && key !== 'hdhrPurist')                                                               traits.push('modStacker');
  if (bareR > 0.70 && hdR < 0.15)                                                                         traits.push('bareHands');

  const breakdown = [
    { mod: 'NM', count: nmCount, color: 'bg-gray-400'   },
    { mod: 'HR', count: hrCount, color: 'bg-rose-400'   },
    { mod: 'DT', count: dtCount, color: 'bg-yellow-400' },
    { mod: 'HD', count: hdCount, color: 'bg-indigo-400' },
  ].filter(b => b.count > 0);

  return { key, traits, breakdown, total, avgAcc };
}

// ─── Archetypes modal ─────────────────────────────────────────────────────────

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-white font-bold text-lg">All Playstyle Archetypes</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Archetypes */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Primary Archetypes</p>
            <div className="space-y-2">
              {Object.values(ARCHETYPES).map(a => (
                <div key={a.label} className={`flex items-start gap-3 rounded-lg p-3 border ${a.border} bg-gray-800`}>
                  <span className="text-2xl shrink-0 mt-0.5">{a.icon}</span>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm ${a.text}`}>{a.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{a.desc}</p>
                    <p className="text-gray-600 text-xs mt-1 font-mono">{a.criteria}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-tags */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Secondary Traits</p>
            <div className="space-y-2">
              {Object.values(TRAITS).map(t => (
                <div key={t.label} className="flex items-start gap-3 rounded-lg p-3 bg-gray-800 border border-gray-700">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5 ${t.style}`}>{t.label}</span>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs">{t.title}</p>
                    <p className="text-gray-600 text-xs mt-0.5 font-mono">{t.criteria}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center">Archetypes are evaluated in priority order — first match wins.</p>
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
      <div className={`bg-gray-800 rounded-lg border ${a.border} overflow-hidden`}>

        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${a.from} ${a.to} px-5 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{a.icon}</span>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-widest font-medium">Playstyle</p>
              <h3 className="text-xl font-bold text-white leading-tight">{a.label}</h3>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-white/60 text-xs">Avg accuracy</p>
              <p className="text-white font-bold text-lg">{avgAcc.toFixed(1)}%</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 transition text-white text-xs font-bold leading-none flex items-center justify-center shrink-0 mt-0.5"
              title="View all archetypes"
            >
              ?
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className={`text-sm mb-5 ${a.text}`}>{a.desc}</p>

          {/* Mod breakdown */}
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

          {/* Trait badges */}
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

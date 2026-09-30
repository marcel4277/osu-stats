import { useState } from 'react';

const COLUMNS = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'score',    label: 'Score'    },
  { key: 'combo',    label: 'Combo'    },
  { key: 'pp',       label: 'PP'       },
  { key: 'date',     label: 'Date'     },
];

const TIME_FILTERS = [
  { label: 'All',      days: null },
  { label: '1M',       days: 30   },
  { label: '3M',       days: 90   },
  { label: '6M',       days: 180  },
  { label: '1Y',       days: 365  },
];

function SortIcon({ direction }) {
  if (!direction) return <span className="ml-1 text-gray-500">⇅</span>;
  return <span className="ml-1 text-osu-pink">{direction === 'asc' ? '↑' : '↓'}</span>;
}

function sortScores(scores, key, direction) {
  if (!key) return scores;
  return [...scores].sort((a, b) => {
    let av = key === 'date' ? new Date(a.date).getTime() : Number(a[key] ?? -Infinity);
    let bv = key === 'date' ? new Date(b.date).getTime() : Number(b[key] ?? -Infinity);
    return direction === 'asc' ? av - bv : bv - av;
  });
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60)                  return 'Just now';
  if (seconds < 3600)                return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400)               return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 86400 * 30)         return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 86400 * 365)        return `${Math.floor(seconds / (86400 * 30))} months ago`;
  const years = Math.floor(seconds / (86400 * 365));
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Soft tinted badges: light text on a faint tint of the same hue, thin border.
const BADGE_BASE = 'px-1.5 py-0.5 rounded text-xs font-bold border';
const AMBER = 'bg-amber-400/10 text-amber-200 border-amber-300/30';
const GREEN = 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30';
const MOD_STYLE = {
  NM: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
  HD: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/30',
  HR: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
  DT: AMBER, NC: AMBER,
  EZ: GREEN, HT: GREEN,
  FL: 'bg-slate-400/10 text-slate-300 border-slate-400/30',
};
const MOD_UNKNOWN = 'bg-gray-400/10 text-gray-300 border-gray-400/30';

// Same colours for the filter chips when selected (a bit stronger tint)
const CHIP_ACTIVE = {
  all:   'bg-gray-600 text-white',
  NM:    'bg-sky-400/25 text-sky-200',
  HR:    'bg-rose-400/25 text-rose-200',
  DT:    'bg-amber-400/25 text-amber-100',
  HD:    'bg-indigo-400/25 text-indigo-200',
  OTHER: 'bg-emerald-400/25 text-emerald-200',
};

function ModBadges({ mods }) {
  const shown = (mods || []).filter(m => m !== 'NF' && m !== 'CL');
  const list = shown.length === 0 ? ['NM'] : shown;
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {list.map(m => (
        <span key={m} className={`${BADGE_BASE} ${MOD_STYLE[m] || MOD_UNKNOWN}`}>{m}</span>
      ))}
    </div>
  );
}

const MOD_FILTERS = [
  { key: 'all',   label: 'All' },
  { key: 'NM',    label: 'NM' },
  { key: 'HR',    label: 'HR' },
  { key: 'DT',    label: 'DT' },
  { key: 'HD',    label: 'HD' },
  { key: 'OTHER', label: 'Other' },
];

const IGNORED_FOR_NM = ['NF', 'CL', 'SO', 'PF', 'SD', 'TD', 'MR'];

// Same idea as the playstyle card: HDHR counts as HR, HDDT/NC counts as DT.
function modMatches(score, key) {
  const m = score.mods || [];
  switch (key) {
    case 'HR':    return m.includes('HR');
    case 'DT':    return m.includes('DT') || m.includes('NC');
    case 'HD':    return m.includes('HD');
    case 'OTHER': return m.some(x => ['EZ', 'HT', 'FL', 'DC'].includes(x));
    case 'NM':    return !m.some(x => !IGNORED_FOR_NM.includes(x));
    default:      return true;
  }
}

function accuracyColor(accuracy) {
  const acc = parseFloat(accuracy);
  if (acc >= 100) return '#f472b6';
  if (acc >= 99)  return '#4ade80';
  if (acc >= 97)  return '#86efac';
  if (acc >= 95)  return '#facc15';
  if (acc >= 90)  return '#fb923c';
  return '#f87171';
}

export default function ScoresList({ scores, username }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [filterDays, setFilterDays] = useState(null);
  const [modFilter, setModFilter] = useState('all');

  if (!scores || scores.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center text-gray-400">
        No scores found
      </div>
    );
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = sortScores(scores, sortKey, sortDir);
  const visible = sorted.filter(sc => modMatches(sc, modFilter));
  const rankOf = new Map(scores.map((sc, i) => [sc.id, i + 1])); // true top-200 position
  const modChips = MOD_FILTERS
    .map(f => ({ ...f, count: f.key === 'all' ? scores.length : scores.filter(sc => modMatches(sc, f.key)).length }))
    .filter(f => f.key === 'all' || f.count > 0);
  const showModChips = modChips.length > 2; // "All" + at least two real options

  const isLazer = (score) => score.score === 0;

  const isInRange = (score) => {
    if (!filterDays) return true;
    const cutoff = Date.now() - filterDays * 86400 * 1000;
    return new Date(score.date).getTime() >= cutoff;
  };

  const handleRowClick = (score) => {
    if (isLazer(score)) return;
    const id = score.best_id;
    if (!id) return;
    const mode = typeof score.mode === 'number'
      ? ['osu', 'taiko', 'fruits', 'mania'][score.mode] ?? 'osu'
      : score.mode || 'osu';
    window.open(`https://osu.ppy.sh/scores/${mode}/${id}`, '_blank', 'noopener,noreferrer');
  };

  const matchCount = (filterDays || modFilter !== 'all') ? visible.filter(isInRange).length : null;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-xl font-bold text-white">
          Best Scores for {username}
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {showModChips && (
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              {modChips.map(f => (
                <button
                  key={f.key}
                  onClick={() => setModFilter(f.key)}
                  title={f.key === 'all' ? 'Show all scores' : `Only ${f.label} scores (${f.count})`}
                  className={`px-3 py-1 text-sm font-semibold transition ${
                    modFilter === f.key
                      ? CHIP_ACTIVE[f.key]
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {f.label}{f.key !== 'all' && <span className="ml-1 text-xs opacity-80">{f.count}</span>}
                </button>
              ))}
            </div>
          )}
          {matchCount !== null && (
            <span className="text-xs text-gray-400 mr-1">
              {matchCount} score{matchCount !== 1 ? 's' : ''}
            </span>
          )}
          <div className="flex rounded-lg overflow-hidden border border-gray-600">
            {TIME_FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => setFilterDays(f.days)}
                className={`px-3 py-1 text-xs font-semibold transition ${
                  filterDays === f.days
                    ? 'bg-osu-pink text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">#</th>
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">Beatmap</th>
              <th className="px-4 py-3 text-center text-gray-400 font-semibold">Mods</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-center text-gray-400 font-semibold cursor-pointer select-none hover:text-white transition"
                >
                  {col.label}<SortIcon direction={sortKey === col.key ? sortDir : null} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((score) => {
              const inRange = isInRange(score);
              const lazer = isLazer(score);
              return (
                <tr
                  key={score.id}
                  className={`border-b border-gray-700 transition ${
                    !inRange ? 'opacity-25' : lazer ? 'cursor-default' : 'hover:bg-gray-700 cursor-pointer'
                  }`}
                  onClick={() => handleRowClick(score)}
                  title={lazer ? undefined : inRange ? 'View score on osu!' : undefined}
                >
                  <td className="px-4 py-3 text-gray-400">{rankOf.get(score.id)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-semibold">{score.title}</p>
                      <p className="text-sm text-gray-400">{score.artist}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><ModBadges mods={score.mods} /></td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="px-3 py-1 rounded text-sm font-semibold bg-black bg-opacity-20"
                      style={{ color: accuracyColor(score.accuracy) }}
                    >
                      {score.accuracy}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-white font-semibold">
                    {score.score === 0
                      ? <span className="relative group inline-block bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-40 px-2 py-0.5 rounded text-xs font-semibold tracking-wide cursor-default">
                          lazer
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                            <span className="block bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                              osu! Lazer uses a different scoring system — legacy score not available
                            </span>
                          </span>
                        </span>
                      : score.score.toLocaleString()
                    }
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {score.combo}x
                  </td>
                  <td className="px-4 py-3 text-center">
                    {score.pp != null
                      ? <span className="text-osu-cyan font-semibold">{score.pp.toLocaleString()}<span className="text-gray-400 text-xs font-normal">pp</span></span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400 relative group cursor-default">
                    {new Date(score.date).toLocaleDateString()}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <span className="block bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        {timeAgo(score.date)}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

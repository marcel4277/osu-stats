import { useState } from 'react';
import { modMatches, buildChips, modColors, MOD_NAMES } from './modUtils.js';

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
    const aValue = key === 'date' ? new Date(a.date).getTime() : Number(a[key] ?? -Infinity);
    const bValue = key === 'date' ? new Date(b.date).getTime() : Number(b[key] ?? -Infinity);
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
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

// Soft tinted badges: light text on a faint tint of the mod's colour, thin border.
const BADGE_BASE = 'px-1.5 py-0.5 rounded text-xs font-bold border';

function chipTitle(chip) {
  if (chip.key === 'all') return 'Show all scores';
  if (chip.key === 'NM') return `No difficulty-changing mods (${chip.count}). NF, SD, PF etc. still count as NM`;
  return `${MOD_NAMES[chip.key] || chip.label} (${chip.count})`;
}

function chipActiveClass(key) {
  return key === 'all' ? 'bg-gray-600 text-white' : modColors(key).chip;
}

function ModBadges({ mods }) {
  const shown = (mods || []).filter(mod => mod !== 'NF' && mod !== 'CL');
  const list = shown.length === 0 ? ['NM'] : shown;
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {list.map(mod => (
        <span key={mod} className={`${BADGE_BASE} ${modColors(mod).badge}`}>{mod}</span>
      ))}
    </div>
  );
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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = sortScores(scores, sortKey, sortDir);
  const visible = sorted.filter(score => modMatches(score, modFilter));
  const rankOf = new Map(scores.map((score, i) => [score.id, i + 1])); // true top-200 position
  const modChips = buildChips(scores);
  const showModChips = modChips.length > 2; // "All" + at least two other options

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
            <div className="flex flex-wrap rounded-lg overflow-hidden border border-gray-600">
              {modChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setModFilter(chip.key)}
                  title={chipTitle(chip)}
                  className={`px-3 py-1 text-sm font-semibold transition ${
                    modFilter === chip.key
                      ? chipActiveClass(chip.key)
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {chip.label}{chip.key !== 'all' && <span className="ml-1 text-xs opacity-80">{chip.count}</span>}
                </button>
              ))}
            </div>
          )}
          {matchCount !== null && (
            <span className="text-xs text-gray-400 mr-1">
              {matchCount} score{matchCount !== 1 ? 's' : ''}
            </span>
          )}
          <div className="flex flex-wrap rounded-lg overflow-hidden border border-gray-600">
            {TIME_FILTERS.map(range => (
              <button
                key={range.label}
                onClick={() => setFilterDays(range.days)}
                className={`px-3 py-1 text-xs font-semibold transition ${
                  filterDays === range.days
                    ? 'bg-osu-pink text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {range.label}
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

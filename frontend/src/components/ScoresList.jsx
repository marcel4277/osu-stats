import { useEffect, useRef, useState } from 'react';
import { modMatches, buildChips, modColors, MOD_NAMES } from './modUtils.js';
import Tooltip from './Tooltip.jsx';

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
  const ago = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (seconds < 60)          return 'Just now';
  if (seconds < 3600)        return ago(Math.floor(seconds / 60), 'minute');
  if (seconds < 86400)       return ago(Math.floor(seconds / 3600), 'hour');
  if (seconds < 86400 * 30)  return ago(Math.floor(seconds / 86400), 'day');
  if (seconds < 86400 * 365) return ago(Math.floor(seconds / (86400 * 30)), 'month');
  return ago(Math.floor(seconds / (86400 * 365)), 'year');
}

// Soft tinted badges: light text on a faint tint of the mod's colour, thin border.
const BADGE_BASE = 'px-1.5 py-0.5 rounded text-xs font-bold border';

function chipTitle(chip) {
  if (chip.key === 'all') return 'Show all scores';
  if (chip.key === 'NM') return 'No difficulty-changing mods. NF, SD, PF etc. still count as NM';
  return MOD_NAMES[chip.key] || chip.label;
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

// Loads a row's cover only once it's near the screen, so a long table doesn't
// download every map background up front.
function useNearScreen() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setNear(true); },
      { rootMargin: '300px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [near]);
  return [ref, near];
}

// A score row. The map's cover sits behind it as a greyed-out, darkened
// backdrop (see .score-row-cover in App.css).
function ScoreRow({ score, rank, inRange, onOpen }) {
  const [ref, near] = useNearScreen();
  const url = score.url;
  const showCover = near && score.cover_url;
  return (
    <tr
      ref={ref}
      className={`border-b border-gray-700 transition ${showCover ? 'score-row-cover' : ''} ${
        !inRange ? 'opacity-25' : url ? 'score-row-link cursor-pointer' : 'cursor-default'
      }`}
      style={showCover ? { '--cover': `url("${score.cover_url}")` } : undefined}
      onClick={() => onOpen(url)}
    >
      <td className="px-4 py-3 text-gray-400">{rank}</td>
      <td className="px-4 py-3">
        <div>
          <p className="text-white font-semibold">
            {url
              ? <Tooltip text="View score on osu!" focusable={false}>
                  <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:underline focus:underline">{score.title}</a>
                </Tooltip>
              : score.title}
          </p>
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
        <div className="flex flex-col items-center gap-0.5">
          {score.score != null ? score.score.toLocaleString() : '—'}
          {score.is_lazer && (
            <Tooltip
              text="osu!lazer score (standardised, max 1,000,000)"
              className="bg-blue-500 bg-opacity-20 text-blue-300 border border-blue-500 border-opacity-40 px-1.5 py-0.5 rounded text-[0.65rem] leading-none font-semibold tracking-wide"
            >
              lazer
            </Tooltip>
          )}
        </div>
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
      <td className="px-4 py-3 text-center text-sm text-gray-400">
        <Tooltip text={timeAgo(score.date)}>
          {new Date(score.date).toLocaleDateString()}
        </Tooltip>
      </td>
    </tr>
  );
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
      setSortDir('desc');
    }
  };

  const sorted = sortScores(scores, sortKey, sortDir);
  const visible = sorted.filter(score => modMatches(score, modFilter));
  const rankOf = new Map(scores.map((score, i) => [score.id, i + 1])); // true top-200 position
  const modChips = buildChips(scores);
  const showModChips = modChips.length > 2; // "All" + at least two other options

  const isInRange = (score) => {
    if (!filterDays) return true;
    const cutoff = Date.now() - filterDays * 86400 * 1000;
    return new Date(score.date).getTime() >= cutoff;
  };

  // Clicking anywhere on a row opens the score; the title is a real link for
  // keyboard users, middle-click and "open in new tab".
  const handleRowClick = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const matchCount = visible.filter(isInRange).length;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-xl font-bold text-white">
          Best Scores for {username}
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {showModChips && (
            <div className="flex flex-wrap rounded-lg border border-gray-600">
              {modChips.map(chip => (
                <Tooltip key={chip.key} text={chipTitle(chip)} placement="bottom" focusable={false}
                  className="first:[&>button]:rounded-l-md last:[&>button]:rounded-r-md">
                  <button
                    onClick={() => setModFilter(chip.key)}
                    aria-pressed={modFilter === chip.key}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold transition ${
                      modFilter === chip.key
                        ? chipActiveClass(chip.key)
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {chip.label}{chip.key !== 'all' && <span className="text-xs opacity-80 tabular-nums">{chip.count}</span>}
                  </button>
                </Tooltip>
              ))}
            </div>
          )}
          {/* Always shown at a fixed width so changing filters doesn't shift the chips */}
          <span className="w-20 text-right text-xs text-gray-400 tabular-nums">
            {matchCount} score{matchCount !== 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap rounded-lg overflow-hidden border border-gray-600">
            {TIME_FILTERS.map(range => (
              <button
                key={range.label}
                onClick={() => setFilterDays(range.days)}
                aria-pressed={filterDays === range.days}
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
              {COLUMNS.map(col => {
                const direction = sortKey === col.key ? sortDir : null;
                return (
                  <th
                    key={col.key}
                    aria-sort={direction ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-4 py-3 text-center text-gray-400 font-semibold"
                  >
                    <button type="button" onClick={() => handleSort(col.key)} className="font-semibold select-none hover:text-white transition">
                      {col.label}<SortIcon direction={direction} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map(score => (
              <ScoreRow
                key={score.id}
                score={score}
                rank={rankOf.get(score.id)}
                inRange={isInRange(score)}
                onOpen={handleRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

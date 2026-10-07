import { useEffect, useRef, useState } from 'react';
import { modMatches, buildChips, modColors, MOD_NAMES } from './modUtils.js';
import { formatDate } from './dateUtils.js';
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
const BADGE_BASE = 'chip-on-cover px-1.5 py-0.5 rounded text-xs font-bold border';

function chipTitle(chip) {
  if (chip.key === 'all') return 'Show all top plays';
  if (chip.key === 'NM') return 'No difficulty-changing mods. NF, SD, PF etc. still count as NM';
  return MOD_NAMES[chip.key] || chip.label;
}

function chipActiveClass(key) {
  return key === 'all' ? 'bg-gray-600 text-white' : modColors(key).chip;
}

// The "lazer" tag isn't one of these: it isn't a mod, so it goes on a line
// of its own (under the mods in the table, at the end of the hit counts on a
// phone card), where it reads apart from them at a glance.
function ModBadges({ mods }) {
  const shown = (mods || []).filter(mod => mod !== 'NF' && mod !== 'CL');
  const list = shown.length === 0 ? ['NM'] : shown;
  return (
    <div className="flex flex-nowrap justify-center gap-1">
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

// True while the screen is at least `minWidth` px wide; follows resizes.
function useWideScreen(minWidth) {
  const query = `(min-width: ${minWidth}px)`;
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setWide(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return wide;
}

// Classes and style shared by the table row and the phone card: the cover
// behind the play, greyed outside the time filter, the pink edge bar inside an
// active filter. A play without a cover has its content dimmed instead.
function playStyling(score, { near, inRange, highlight, dimSelector }) {
  const showCover = near && score.cover_url;
  const className = [
    'border-b border-gray-700 transition',
    showCover ? `score-row-cover ${inRange ? '' : 'score-row-cover-muted'}` : '',
    inRange || score.cover_url ? '' : dimSelector,
    highlight ? 'score-row-active' : '',
    score.url ? 'score-row-link cursor-pointer' : 'cursor-default',
  ].join(' ');
  const style = showCover ? { '--cover': `url("${score.cover_url}")` } : undefined;
  return { className, style };
}

// "lazer": on its own line, under the mods. The tooltip explains the score
// too, which for a lazer play is osu!'s standardised one.
function LazerTag() {
  return (
    <Tooltip
      text="Set on osu!lazer. Its score is the standardised one (max 1,000,000)"
      className="chip-on-cover bg-gray-700/40 text-gray-300 border border-gray-500/50 py-0.5 px-1.5 rounded text-[0.65rem] leading-none font-semibold tracking-wide"
    >
      lazer
    </Tooltip>
  );
}

// Hit counts: 300s, 100s, 50s and misses. Misses are red only when there
// are any (the one count that marks a play as not clean); the rest stay white.
// A cross drawn to match the labels: the "✕" character isn't in the site's
// font, so the browser borrowed a thinner one from another font
function MissIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-label="misses" className="w-2 h-2 self-center" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
    </svg>
  );
}

const HIT_TYPES = [
  { key: 'great', label: '300' },
  { key: 'ok',    label: '100' },
  { key: 'meh',   label: '50'  },
  { key: 'miss',  label: <MissIcon /> },
];

function hitClass(hits, key) {
  return key === 'miss' && hits.miss > 0 ? 'hit-miss text-red-400 font-semibold' : 'text-white';
}

// The accuracy, score and combo columns: fixed widths, shared by the header
// cells and the grid inside each row's combined cell. In COLUMNS order, so
// those three must stay first there.
const STATS_WIDTHS = ['w-[7.75rem]', 'w-[7.5rem]', 'w-[6.5rem]'];
const STATS_GRID = 'grid-cols-[7.75rem_7.5rem_6.5rem]';
// The hit counts are centred under the score. They span all three columns,
// whose middle is (7.75 - 6.5) / 2 = 0.625rem left of the score's; 1.25rem of
// left padding moves it there.
const UNDER_SCORE = 'pl-[1.25rem]';

// The hit counts, "300 1,218  100 16  50 0  ✕ 1": each label tight to its
// number, the same gap between every count, sized to the numbers (no fixed
// slots, so no holes when a count is short).
// extra (phone card): something for the right-hand end of the line; the line
// is drawn for it even without counts (a saved copy from before they were
// added).
function HitLine({ hits, extra = null, className = '' }) {
  if (!hits && !extra) return null;
  return (
    <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-0.5 tabular-nums text-xs ${className}`}>
      {hits && HIT_TYPES.map(t => (
        <span key={t.key} className="inline-flex items-baseline gap-1 whitespace-nowrap">
          <span className="hit-label inline-flex text-gray-400">{t.label}</span>
          <span className={hitClass(hits, t.key)}>{hits[t.key].toLocaleString()}</span>
        </span>
      ))}
      {/* -my-px: the tag is 2px taller than a line of text; without this,
          cards with it were 1px taller than the rest */}
      {extra && <span className="ml-auto self-center -my-px">{extra}</span>}
    </div>
  );
}

// Table rows are two lines, the same in every column, so nothing hangs
// between them: line 1 the main values (title, mods, accuracy, score, combo,
// pp, date), line 2 the details (artist, lazer tag, hit counts).
const LINE_1 = 'h-6 flex items-center';
const LINE_2 = 'h-5 flex items-center';

// A score row. The map's cover sits behind it as a darkened backdrop: full
// colour normally, greyed out when the row is outside the time filter
// (see .score-row-cover in App.css).
// highlight: a time filter is active and this row is inside it.
function ScoreRow({ score, rank, inRange, highlight, onOpen }) {
  const [ref, near] = useNearScreen();
  const url = score.url;
  const { className, style } = playStyling(score, { near, inRange, highlight, dimSelector: '[&>td]:opacity-60' });
  return (
    <tr ref={ref} className={`${className} [&>td]:align-top`} style={style} onClick={() => onOpen(url)}>
      <td className="px-4 py-3 text-gray-400"><div className={LINE_1}>{rank}</div></td>
      {/* w-full + max-w-0: the beatmap column takes the leftover width and long
          titles are cut off with "…" instead of wrapping onto a second line */}
      <td className="px-4 py-3 w-full max-w-0 min-w-[10rem]">
        <p className="h-6 leading-6 text-white font-semibold">
          {url
            ? <Tooltip text={<>{score.title}<br /><span className="text-gray-400">View score on osu!</span></>} focusable={false} className="max-w-full">
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="min-w-0 truncate hover:underline focus:underline">{score.title}</a>
              </Tooltip>
            : <span className="block truncate">{score.title}</span>}
        </p>
        <p className="h-5 leading-5 text-sm text-gray-400 truncate">{score.artist}</p>
      </td>
      <td className="px-4 py-3">
        <div className={`${LINE_1} justify-center`}><ModBadges mods={score.mods} /></div>
        {score.is_lazer && <div className={`${LINE_2} justify-center`}><LazerTag /></div>}
      </td>
      {/* Accuracy, score and combo share one cell, so the hit counts can run
          underneath all three. Its grid uses the header's column widths, so
          each value still sits under its own heading. */}
      <td colSpan={3} className="py-3">
        <div className={`grid ${STATS_GRID} grid-rows-[1.5rem_1.25rem] items-center justify-items-center`}>
          <span
            className="chip-on-cover px-3 py-0.5 rounded text-sm font-semibold bg-black bg-opacity-20"
            style={{ color: accuracyColor(score.accuracy) }}
          >
            {score.accuracy}%
          </span>
          <span className="text-white font-semibold">{score.score != null ? score.score.toLocaleString() : '—'}</span>
          <span className="text-gray-400">{score.combo.toLocaleString()}x</span>
          <div className={`col-span-3 ${UNDER_SCORE}`}><HitLine hits={score.hits} className="flex-nowrap" /></div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={`${LINE_1} justify-center`}>
          {score.pp != null
            ? <span className="text-white font-semibold">{score.pp.toLocaleString()}<span className="text-gray-400 text-xs font-normal">pp</span></span>
            : <span className="text-gray-400">—</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        <div className={`${LINE_1} justify-center`}>
          <Tooltip text={timeAgo(score.date)} className="whitespace-nowrap">
            {formatDate(score.date)}
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

// A play on screens too narrow for the table: three lines, nothing left out.
//   rank title ....... pp
//   artist ........ mods
//   acc  score  combo  date
// The rank sits on the title line rather than in its own column, so the
// stats line gets the full width (a lazer play's line needs every pixel).
function ScoreCard({ score, rank, inRange, highlight, onOpen }) {
  const [ref, near] = useNearScreen();
  const url = score.url;
  const { className, style } = playStyling(score, { near, inRange, highlight, dimSelector: '[&>*]:opacity-60' });
  return (
    <li ref={ref} className={`${className} px-3 py-2.5`} style={style} onClick={() => onOpen(url)}>
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <p className="min-w-0 flex-1 truncate text-white font-semibold">
            <span className="mr-2 text-sm font-normal text-gray-400 tabular-nums">{rank}</span>
            {url
              ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:underline focus:underline">{score.title}</a>
              : score.title}
          </p>
          <span className="shrink-0">
            {score.pp != null
              ? <span className="text-white font-semibold">{score.pp.toLocaleString()}<span className="text-gray-400 text-xs font-normal">pp</span></span>
              : <span className="text-gray-400">—</span>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm text-gray-400">{score.artist}</p>
          <div className="shrink-0"><ModBadges mods={score.mods} /></div>
        </div>
        {/* wraps rather than cutting off on the narrowest phones */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-gray-400 tabular-nums">
          <span className="font-semibold" style={{ color: accuracyColor(score.accuracy) }}>{score.accuracy}%</span>
          <span className="flex items-center gap-1 text-white">
            {score.score != null ? score.score.toLocaleString() : '—'}
          </span>
          <span>{score.combo.toLocaleString()}x</span>
          <Tooltip text={timeAgo(score.date)} placement="left" className="ml-auto whitespace-nowrap">
            {formatDate(score.date)}
          </Tooltip>
        </div>
        {/* The lazer tag ends this line, under the mods and date on the right */}
        <HitLine hits={score.hits} extra={score.is_lazer && <LazerTag />} className="mt-0.5" />
      </div>
    </li>
  );
}

// Below this width the table doesn't fit (it needs about 950px), so plays
// are shown as cards with a sort menu instead of column headers
const TABLE_MIN_SCREEN = 1024;

const SORT_OPTIONS = [{ key: 'pp', label: 'PP' }, ...COLUMNS.filter(col => col.key !== 'pp')];

export default function ScoresList({ scores, username }) {
  const wide = useWideScreen(TABLE_MIN_SCREEN);
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
        <div className={`flex items-center justify-between gap-3 ${wide ? '' : 'w-full'}`}>
          {/* narrow screens: the name is already in the player card just above,
              and the sort menu needs the room */}
          <h3 className={`min-w-0 truncate font-bold text-white ${wide ? 'text-xl' : 'text-lg'}`}>
            {wide ? `Top Plays for ${username}` : 'Top Plays'}
          </h3>
          {/* No column headers on narrow screens, so sorting is a menu plus a
              direction button. No sort chosen = top-play order, i.e. by pp. */}
          {!wide && (
            <div className="flex shrink-0 rounded-lg border border-gray-600 bg-gray-900 text-sm font-semibold">
              {/* The visible label is just the current choice; the real menu
                  sits invisibly on top of it (a native menu would be as wide
                  as its longest option) and opens the phone's own picker. */}
              <span className="relative flex items-center gap-1.5 pl-3 pr-2.5 py-1 text-gray-200 rounded-l-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-osu-purple">
                {SORT_OPTIONS.find(opt => opt.key === (sortKey ?? 'pp')).label}
                <span aria-hidden="true" className="text-gray-400 text-xs">▾</span>
                <select
                  value={sortKey ?? 'pp'}
                  onChange={e => { setSortKey(e.target.value); setSortDir('desc'); }}
                  aria-label="Sort top plays by"
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                </select>
              </span>
              <button
                type="button"
                onClick={() => { setSortKey(k => k ?? 'pp'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }}
                aria-label={sortDir === 'desc' ? 'Highest first; switch to lowest first' : 'Lowest first; switch to highest first'}
                className="px-2.5 border-l border-gray-600 text-osu-pink rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-osu-purple"
              >
                {sortDir === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-3 flex-wrap ${wide ? "" : "w-full"}`}>
          {showModChips && (
            <div className="flex flex-wrap rounded-lg border border-gray-600">
              {modChips.map(chip => (
                <Tooltip key={chip.key} text={chipTitle(chip)} placement="bottom" focusable={false}
                  className="first:[&>button]:rounded-l-md last:[&>button]:rounded-r-md">
                  <button
                    onClick={() => setModFilter(chip.key)}
                    aria-pressed={modFilter === chip.key}
                    className={`inline-flex items-center gap-1 py-1 text-sm font-semibold transition ${wide ? 'px-3' : 'px-2.5'} ${
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
          {/* Fixed width on wide screens so changing filters doesn't shift the chips;
              on narrow screens it sits at the end of the time-filter line */}
          <span className={`text-right text-xs text-gray-400 tabular-nums ${wide ? 'w-20' : 'order-last ml-auto'}`}>
            {matchCount} play{matchCount !== 1 ? 's' : ''}
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

      {!wide && (
        <ul className="scores-table">
          {visible.map(score => (
            <ScoreCard
              key={score.id}
              score={score}
              rank={rankOf.get(score.id)}
              inRange={isInRange(score)}
              highlight={filterDays != null && isInRange(score)}
              onOpen={handleRowClick}
            />
          ))}
        </ul>
      )}

      {wide && (
        <div className="overflow-x-auto">
          <table className="scores-table w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">#</th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">Beatmap</th>
                <th className="px-4 py-3 text-center text-gray-400 font-semibold">Mods</th>
                {COLUMNS.map((col, i) => {
                  const direction = sortKey === col.key ? sortDir : null;
                  return (
                    <th
                      key={col.key}
                      aria-sort={direction ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-4 py-3 text-center text-gray-400 font-semibold ${STATS_WIDTHS[i] ?? ''}`}
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
                  highlight={filterDays != null && isInRange(score)}
                  onOpen={handleRowClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { modMatches, buildChips, modColors, MOD_NAMES } from './modUtils.js';
import { formatDate } from './dateUtils.js';
import Tooltip from './Tooltip.jsx';

// What the plays can be sorted by (the "PP ▾ ↓" menu)
const SORT_FIELDS = [
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
// of its own (under the mods on a wide row, at the end of the hit counts on a
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

// Loads a play's cover only once it's near the screen, so a long list doesn't
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

// Classes and style shared by the wide row and the phone card: the cover
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

// Hit counts: 300s, 100s, 50s and misses. Each label is in osu!'s own
// judgement colour (300 blue, 100 green, 50 yellow, miss red): players read
// these at a glance, so the colours carry meaning even though they share hues
// with the accuracy and mod colours. Numbers are white; a miss count is red
// only when there are any.
// A cross drawn to match the labels: the "✕" character isn't in the site's
// font, so the browser borrowed a thinner one from another font.
function MissIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-label="misses" className="w-2 h-2 self-center" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
    </svg>
  );
}

const HIT_TYPES = [
  { key: 'great', label: '300',         colour: '#7dd3fc' }, // sky-300
  { key: 'ok',    label: '100',         colour: '#a3e635' }, // lime-400
  { key: 'meh',   label: '50',          colour: '#fcd34d' }, // amber-300
  { key: 'miss',  label: <MissIcon />,  colour: '#f87171' }, // red-400
];

function hitClass(hits, key) {
  return key === 'miss' && hits.miss > 0 ? 'hit-miss text-red-400 font-semibold' : 'text-white';
}

// The hit counts on one line, "300 1,218  100 16  50 0  × 1": each label
// tight to its number, the same gap between every count.
// extra (phone card): something for the right-hand end of the line (the lazer
// tag); the line is drawn for it even without counts (a saved copy from
// before they were added).
function HitLine({ hits, extra = null, className = '' }) {
  if (!hits && !extra) return null;
  return (
    <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-0.5 tabular-nums text-xs ${className}`}>
      {hits && HIT_TYPES.map(t => (
        <span key={t.key} className="inline-flex items-baseline gap-1 whitespace-nowrap">
          <span className="hit-label inline-flex font-semibold" style={{ color: t.colour }}>{t.label}</span>
          <span className={hitClass(hits, t.key)}>{hits[t.key].toLocaleString()}</span>
        </span>
      ))}
      {/* -my-px: the tag is 2px taller than a line of text; without this,
          cards with it were 1px taller than the rest */}
      {extra && <span className="ml-auto self-center -my-px">{extra}</span>}
    </div>
  );
}

// The map's star rating (nomod, as on osu!'s profile list), in a neutral chip
function Stars({ stars }) {
  if (stars == null) return null;
  return (
    <span className="chip-on-cover inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold leading-none bg-gray-700/40 border border-gray-500/50 text-gray-200 shrink-0">
      ★ {stars.toFixed(2)}
    </span>
  );
}

const ppText = score => (score.pp != null
  ? <span className="text-white font-bold text-xl">{score.pp.toLocaleString()}<span className="text-gray-400 text-sm font-normal">pp</span></span>
  : <span className="text-gray-400">—</span>);

// A play on a wide screen: one card per row, laid out like osu!'s own
// profile list. The map's cover sits behind it as a darkened backdrop (full
// colour normally, greyed out outside the time filter; see .score-row-cover
// in App.css).
//   rank  Title by Artist          mods    99.50%  1,204x           700pp
//         ★ 5.42  Insane  6 days ago  lazer   300 2,481  100 44 ...  207,201,876
// highlight: a time filter is active and this play is inside it.
function PlayRow({ score, rank, inRange, highlight, onOpen }) {
  const [ref, near] = useNearScreen();
  const url = score.url;
  const { className, style } = playStyling(score, { near, inRange, highlight, dimSelector: '[&>*]:opacity-60' });
  return (
    <li ref={ref} className={`${className} grid grid-cols-[2rem_minmax(0,1fr)_7rem_14rem_8rem] items-center gap-x-6 px-5 py-3`} style={style} onClick={() => onOpen(url)}>
      <span className="play-rank text-gray-400 tabular-nums">{rank}</span>
      <div className="min-w-0">
        <p className="truncate text-white font-semibold">
          {url
            ? <Tooltip text={<>{score.title}<br /><span className="text-gray-400">View score on osu!</span></>} focusable={false} className="max-w-full">
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="min-w-0 truncate hover:underline focus:underline">{score.title}</a>
              </Tooltip>
            : score.title}
          <span className="ml-1.5 text-sm font-normal text-gray-400">by {score.artist}</span>
        </p>
        <div className="flex items-center gap-2.5 text-sm text-gray-400 min-w-0">
          <Stars stars={score.stars} />
          {score.version && <span className="truncate">{score.version}</span>}
          <Tooltip text={formatDate(score.date)} className="whitespace-nowrap shrink-0">{timeAgo(score.date)}</Tooltip>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ModBadges mods={score.mods} />
        {score.is_lazer && <LazerTag />}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-4 tabular-nums">
          <span className="font-semibold" style={{ color: accuracyColor(score.accuracy) }}>{score.accuracy}%</span>
          <span className="text-white font-semibold">{score.combo.toLocaleString()}x</span>
        </div>
        <HitLine hits={score.hits} className="flex-nowrap" />
      </div>
      <div className="flex flex-col items-end">
        {ppText(score)}
        <span className="text-xs text-gray-400 tabular-nums">{score.score != null ? score.score.toLocaleString() : '—'}</span>
      </div>
    </li>
  );
}

// A play on a narrow screen: four lines, nothing left out.
//   rank title ....... pp
//   artist ........ mods
//   acc  score  combo  date
//   300 1,218  100 16  50 0  × 1   lazer
// The rank sits on the title line rather than in its own column, so the
// stats line gets the full width.
function ScoreCard({ score, rank, inRange, highlight, onOpen }) {
  const [ref, near] = useNearScreen();
  const url = score.url;
  const { className, style } = playStyling(score, { near, inRange, highlight, dimSelector: '[&>*]:opacity-60' });
  return (
    <li ref={ref} className={`${className} px-3 py-2.5`} style={style} onClick={() => onOpen(url)}>
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <p className="min-w-0 flex-1 truncate text-white font-semibold">
            <span className="play-rank mr-2 text-sm font-normal text-gray-400 tabular-nums">{rank}</span>
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

// Below this width a play's row doesn't fit, so plays are shown as the
// narrower four-line cards instead
const WIDE_ROWS_MIN_SCREEN = 1024;

const SORT_OPTIONS = [{ key: 'pp', label: 'PP' }, ...SORT_FIELDS.filter(field => field.key !== 'pp')];

export default function ScoresList({ scores, username }) {
  const wide = useWideScreen(WIDE_ROWS_MIN_SCREEN);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [filterDays, setFilterDays] = useState(null);
  const [modFilter, setModFilter] = useState('all');

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
          {/* Sorting is a menu plus a direction button (the rows have no column
              headers). No sort chosen = top-play order, i.e. by pp. */}
          {(
            <div className="flex shrink-0 rounded-lg border border-gray-600 bg-gray-900 text-sm font-semibold">
              {/* The visible label is just the current choice; the real menu
                  sits invisibly on top of it (a native menu would be as wide
                  as its longest option); on a phone it opens the phone's own
                  picker. */}
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

      <ul className="plays-list">
        {visible.map(score => {
          const Play = wide ? PlayRow : ScoreCard;
          return (
            <Play
              key={score.id}
              score={score}
              rank={rankOf.get(score.id)}
              inRange={isInRange(score)}
              highlight={filterDays != null && isInRange(score)}
              onOpen={handleRowClick}
            />
          );
        })}
      </ul>
    </div>
  );
}

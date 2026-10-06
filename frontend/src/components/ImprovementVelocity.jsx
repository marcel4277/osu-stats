import { useMemo } from 'react';

const MONTHS_SHOWN = 18;

// Each verdict also carries a tooltip shown when hovering the badge.
function buildVerdict(daysSinceLast, last90, last180) {
  if (daysSinceLast <= 14 && last90  >= 5) return { label: 'Actively Improving', color: 'text-green-400',  border: 'border-green-400',  dot: 'bg-green-400',  tip: 'Top play within 14 days + 5 or more in the last 90 days'   };
  if (daysSinceLast <= 60 && last90  >= 3) return { label: 'On the Rise',        color: 'text-osu-cyan',  border: 'border-osu-cyan',   dot: 'bg-osu-cyan',   tip: 'Top play within 60 days + 3 or more in the last 90 days'   };
  if (daysSinceLast <= 90 && last180 >= 1) return { label: 'Still Active',       color: 'text-purple-300',border: 'border-osu-purple', dot: 'bg-osu-purple', tip: 'Top play within 90 days'                                    };
  if (daysSinceLast <= 270)               return { label: 'Slowing Down',       color: 'text-yellow-400',border: 'border-yellow-400', dot: 'bg-yellow-400', tip: 'No top play in 4–9 months'                                  };
  if (daysSinceLast <= 365)               return { label: 'Plateaued',          color: 'text-orange-400',border: 'border-orange-400', dot: 'bg-orange-400', tip: 'No top play in 9–12 months'                                 };
  return                                         { label: 'Inactive',           color: 'text-red-400',   border: 'border-red-400',    dot: 'bg-red-400',    tip: 'No top play set in over a year'                            };
}

function formatMonthLabel(year, month) {
  return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
}

// Round the chart's top up to a clean, even number so the middle gridline is
// a whole number too (e.g. 29 -> 30, so the gridlines read 30 / 15 / 0).
const NICE_MAXES = [2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 50, 60, 80, 100, 150, 200];
function niceMax(n) {
  return NICE_MAXES.find(m => m >= n) ?? Math.ceil(n / 100) * 100;
}

function pluralise(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export default function ImprovementVelocity({ scores }) {
  const stats = useMemo(() => {
    if (!scores || scores.length === 0) return null;

    const now = new Date();
    const dates = scores.map(s => new Date(s.date));

    const latest = new Date(Math.max(...dates));
    const daysSinceLast = Math.floor((now - latest) / 86400000);

    const ms90  = 90  * 86400000;
    const ms180 = 180 * 86400000;
    const last90  = dates.filter(d => now - d <= ms90).length;
    const last180 = dates.filter(d => now - d <= ms180).length;

    const monthCounts = {};
    for (const d of dates) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    }

    // Busiest month; on a tie, the most recent one (keys are "YYYY-MM", so they sort by date)
    const peakEntry = Object.entries(monthCounts).sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0];
    const [peakYear, peakMonth] = peakEntry[0].split('-').map(Number);
    const peakCount = peakEntry[1];

    const oldest = new Date(Math.min(...dates));
    const spanMonths = (latest.getFullYear() - oldest.getFullYear()) * 12
      + (latest.getMonth() - oldest.getMonth());

    const buckets = [];
    for (let i = MONTHS_SHOWN - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        key,
        label: formatMonthLabel(d.getFullYear(), d.getMonth() + 1),
        count: monthCounts[key] || 0,
        // every month that ties for the highest count is highlighted
        isPeak: (monthCounts[key] || 0) === peakCount,
        isCurrent: i === 0,
      });
    }
    const maxCount = niceMax(Math.max(...buckets.map(b => b.count), 1));
    const verdict = buildVerdict(daysSinceLast, last90, last180);

    return { daysSinceLast, last90, peakCount, peakLabel: formatMonthLabel(peakYear, peakMonth), spanMonths, buckets, maxCount, verdict };
  }, [scores]);

  if (!stats) return null;
  const { daysSinceLast, last90, peakCount, peakLabel, spanMonths, buckets, maxCount, verdict } = stats;

  // Legend entries only for colours actually on the chart: the peak month can
  // be older than the 18 months shown, and this month may have no plays yet.
  const showPeak = buckets.some(b => b.isPeak && b.count > 0);
  const showCurrent = buckets[buckets.length - 1].count > 0;

  const lastScoreLabel = daysSinceLast === 0 ? 'Today' : pluralise(daysSinceLast, 'day') + ' ago';
  const spanLabel = spanMonths < 1 ? '< 1 month'
    : spanMonths < 12 ? pluralise(spanMonths, 'month')
    : pluralise(Math.round(spanMonths / 12), 'year');

  const insightText = last90 > 0
    ? `${pluralise(last90, 'top play')} set in the last 90 days — ${last90 >= 5 ? 'a strong recent push.' : 'still grinding.'}`
    : `No top plays in the last 90 days.${daysSinceLast > 365 ? ' This player may have stepped back from competing.' : ' A return could mean new peaks soon.'}`;

  return (
    <div className="relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Improvement Velocity</h3>
            <p className="text-gray-400 text-sm mt-0.5">Based on {scores.length} top plays</p>
          </div>
          <div
            tabIndex={0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 bg-gray-900 cursor-default group relative focus:outline-none"
          >
            {/* the dot is the only coloured part: it says how active the player is */}
            <span className={`w-2 h-2 rounded-full ${verdict.dot}`} />
            <span className="text-sm font-semibold text-gray-200">{verdict.label}</span>
            {/* Hover tooltip */}
            <div role="tooltip" className="absolute right-0 top-full mt-2 hidden group-hover:block group-focus-visible:block [@media(hover:none)]:group-focus:block z-20 pointer-events-none">
              <div className="bg-gray-900 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-xl text-left">
                {verdict.tip}
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip, same style as the player card's */}
        <div className="grid grid-cols-3 divide-x divide-gray-700 border-y border-gray-700 py-3 mb-6">
          {[
            { label: 'Last Top Play', value: lastScoreLabel },
            { label: 'Peak Month',     value: peakLabel, sub: `${peakCount} plays` },
            { label: 'Active Span',    value: spanLabel },
          ].map(({ label, value, sub }) => (
            <div key={label} className="min-w-0 px-4 first:pl-0">
              <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
              <p className="text-white text-lg font-semibold truncate">
                {value}
                {sub && <span className="ml-2 text-gray-400 text-xs font-normal">{sub}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-gray-400 text-sm uppercase tracking-widest">Activity · last 18 months</p>
          {/* What the highlighted bar colours mean */}
          {(showPeak || showCurrent) && (
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {showPeak && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-osu-pink" />Peak month
                </span>
              )}
              {showCurrent && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />This month
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative h-28 pl-7">
          {/* Gridlines: faint, solid hairlines; the baseline a step brighter.
              The top and middle ones carry the scale (e.g. 30 / 15). */}
          <div className="absolute inset-x-0 top-5 bottom-0 flex flex-col justify-between pointer-events-none">
            {[maxCount, maxCount / 2].map(tick => (
              <div key={tick} className="relative ml-7 border-t border-gray-700/50">
                <span className="absolute -left-7 w-5 -top-1.5 text-right text-[10px] leading-none text-gray-500 tabular-nums">{tick}</span>
              </div>
            ))}
            <div className="ml-7 border-t border-gray-600" />
          </div>

          {/* Bars: capped at 24px wide with air between them, rounded at the
              top and square at the baseline. Empty months draw nothing. The
              peak month gets its count written on top. */}
          <div className="absolute left-7 right-0 top-5 bottom-0 flex items-end gap-1">
            {buckets.map(b => {
              const heightPct = b.count === 0 ? 0 : Math.max((b.count / maxCount) * 100, 4);
              const barColor = b.isPeak
                ? 'bg-osu-pink'
                : b.isCurrent
                ? 'bg-gray-300'
                : 'bg-violet-500';

              return (
                <div key={b.key} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Hover tooltip (the whole column is the hover target) */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
                      <p className="font-semibold">{b.label}</p>
                      <p className="text-gray-400">{b.count === 0 ? 'No top plays' : pluralise(b.count, 'top play')}</p>
                    </div>
                  </div>

                  {b.isPeak && b.count > 0 && (
                    <span className="text-xs font-semibold text-gray-200 mb-1 leading-none">{b.count}</span>
                  )}
                  {b.count > 0 && (
                    <div
                      className={`w-full max-w-[24px] shrink-0 rounded-t transition-all duration-500 group-hover:brightness-125 ${barColor}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Month labels: one under every bar on wider screens, every third
            on phones (18 don't fit). Lined up with the bars (ml-7 = scale column). */}
        <div className="flex gap-1 mt-1.5 ml-7">
          {buckets.map((b, i) => (
            <div key={b.key} className="flex-1 min-w-0 text-center">
              <span className={`text-gray-400 text-xs ${i % 3 === 0 ? '' : 'hidden sm:inline'}`}>{b.label.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="mt-5 flex items-start gap-2 border-t border-gray-700 pt-4">
          <span className="text-gray-400 text-sm mt-0.5">◆</span>
          <p className="text-sm text-gray-400 leading-relaxed">{insightText}</p>
        </div>
      </div>
    </div>
  );
}

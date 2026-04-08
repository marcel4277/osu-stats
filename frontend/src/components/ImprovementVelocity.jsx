import { useMemo } from 'react';

const MONTHS_SHOWN = 18;

// Each verdict also carries a tooltip string shown on hover of the badge.
function buildVerdict(daysSinceLast, last90, last180) {
  if (daysSinceLast <= 14 && last90  >= 5) return { label: 'Actively Improving', color: 'text-green-400',  border: 'border-green-400',  glow: 'shadow-green-400/20',  dot: 'bg-green-400',  tip: 'Top score within 14 days + 5 or more in the last 90 days'   };
  if (daysSinceLast <= 60 && last90  >= 3) return { label: 'On the Rise',        color: 'text-osu-cyan',  border: 'border-osu-cyan',   glow: 'shadow-cyan-400/20',   dot: 'bg-osu-cyan',   tip: 'Top score within 60 days + 3 or more in the last 90 days'   };
  if (daysSinceLast <= 120&& last180 >= 1) return { label: 'Still Active',       color: 'text-osu-purple',border: 'border-osu-purple', glow: 'shadow-purple-400/20', dot: 'bg-osu-purple', tip: 'Top score within 120 days'                                   };
  if (daysSinceLast <= 270)               return { label: 'Slowing Down',       color: 'text-yellow-400',border: 'border-yellow-400', glow: 'shadow-yellow-400/20', dot: 'bg-yellow-400', tip: 'No top score in 4–9 months'                                  };
  if (daysSinceLast <= 365)               return { label: 'Plateaued',          color: 'text-orange-400',border: 'border-orange-400', glow: 'shadow-orange-400/20', dot: 'bg-orange-400', tip: 'No top score in 9–12 months'                                 };
  return                                         { label: 'Inactive',           color: 'text-red-400',   border: 'border-red-400',    glow: 'shadow-red-400/20',    dot: 'bg-red-400',    tip: 'No top score set in over a year'                            };
}

function formatMonthLabel(year, month) {
  return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
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

    const peakEntry = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
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
        isPeak: key === peakEntry[0],
        isCurrent: i === 0,
      });
    }
    const maxCount = Math.max(...buckets.map(b => b.count), 1);
    const verdict = buildVerdict(daysSinceLast, last90, last180);

    return { daysSinceLast, last90, peakCount, peakKey: formatMonthLabel(peakYear, peakMonth), spanMonths, buckets, maxCount, verdict };
  }, [scores]);

  if (!stats) return null;
  const { daysSinceLast, last90, peakCount, peakKey, spanMonths, buckets, maxCount, verdict } = stats;

  const lastScoreLabel = daysSinceLast === 0 ? 'Today' : pluralise(daysSinceLast, 'day') + ' ago';
  const spanLabel = spanMonths < 1 ? '< 1 month'
    : spanMonths < 12 ? pluralise(spanMonths, 'month')
    : pluralise(Math.round(spanMonths / 12), 'year');

  const insightText = last90 > 0
    ? `${pluralise(last90, 'top score')} set in the last 90 days — ${last90 >= 5 ? 'a strong recent push.' : 'still grinding.'}`
    : `No top scores in the last 90 days.${daysSinceLast > 365 ? ' This player may have stepped back from competing.' : ' A return could mean new peaks soon.'}`;

  return (
    <div className={`relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg ${verdict.glow}`}>

      {/* Coloured top accent bar */}
      <div className={`h-1 w-full ${verdict.dot}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Improvement Velocity</h3>
            <p className="text-gray-500 text-xs mt-0.5">Based on {scores.length} top scores</p>
          </div>
          <div
            title={verdict.tip}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${verdict.border} bg-gray-900 cursor-default group relative`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${verdict.dot} animate-pulse`} />
            <span className={`text-sm font-semibold ${verdict.color}`}>{verdict.label}</span>
            {/* Hover tooltip */}
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-20 pointer-events-none">
              <div className="bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl text-left">
                {verdict.tip}
              </div>
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Last Top Score', value: lastScoreLabel,           accent: verdict.color },
            { label: 'Peak Month',     value: `${peakKey}`,             sub: `${peakCount} scores`, accent: 'text-osu-pink' },
            { label: 'Active Span',    value: spanLabel,                accent: 'text-osu-cyan' },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">{label}</p>
              <p className={`font-bold text-sm ${accent}`}>{value}</p>
              {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Chart */}
        <p className="text-gray-500 text-xs mb-3 uppercase tracking-widest">Activity · last 18 months</p>

        <div className="relative">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: '6rem' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-full border-t border-gray-700 border-dashed opacity-40" />
            ))}
          </div>

          {/* Bars */}
          <div className="flex items-end gap-1 h-24 relative">
            {buckets.map(b => {
              const heightPct = b.count === 0 ? 0 : Math.max((b.count / maxCount) * 100, 8);
              const barColor = b.count === 0
                ? 'bg-gray-700 opacity-20'
                : b.isPeak
                ? 'bg-gradient-to-t from-osu-pink to-yellow-300'
                : b.isCurrent
                ? 'bg-gradient-to-t from-osu-cyan to-blue-300'
                : 'bg-gradient-to-t from-osu-purple to-osu-pink';

              return (
                <div key={b.key} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-900 border border-gray-600 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
                      <p className="font-semibold">{b.label}</p>
                      <p className="text-gray-400">{b.count === 0 ? 'No scores' : pluralise(b.count, 'score')}</p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${barColor}`}
                    style={{ height: b.count === 0 ? '3px' : `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Month labels */}
        <div className="flex gap-1 mt-1.5">
          {buckets.map((b, i) => (
            <div key={b.key} className="flex-1 text-center">
              {i % 3 === 0 && (
                <span className="text-gray-500 text-xs">{b.label.split(' ')[0]}</span>
              )}
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="mt-5 flex items-start gap-2 border-t border-gray-700 pt-4">
          <span className="text-gray-500 text-xs mt-0.5">◆</span>
          <p className="text-xs text-gray-400 leading-relaxed">{insightText}</p>
        </div>
      </div>
    </div>
  );
}

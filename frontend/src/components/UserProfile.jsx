import Tooltip from './Tooltip.jsx';

function RankDelta({ history, currentRank }) {
  if (!history || history.length < 2 || !currentRank) return null;
  const earliest = history.find(v => v > 0);
  if (!earliest) return null;
  const delta = earliest - currentRank; // positive = improved (rank number went down)
  if (delta === 0) return null;
  const improved = delta > 0;
  return (
    <Tooltip text="Change over the last 90 days" className={`text-xs font-semibold ${improved ? 'text-green-400' : 'text-red-400'}`}>
      {improved ? '▲' : '▼'}{Math.abs(delta).toLocaleString()}
    </Tooltip>
  );
}

// Big stat on the right of the banner header (global rank, pp). Every hero
// stat has the same two lines (label, value) so their baselines line up;
// extras like the rank change go on the label line.
function HeroStat({ label, extra, value, compact }) {
  return (
    <div className="text-right">
      <p className="flex items-center justify-end gap-1.5 text-gray-200 text-xs uppercase tracking-wider leading-5">
        {label}{extra}
      </p>
      <p className={`text-white font-bold leading-none ${compact ? 'text-xl' : 'text-3xl'}`}>{value}</p>
    </div>
  );
}

// Small stat in the strip under the header
function Stat({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-white text-lg font-semibold truncate">{value}</p>
    </div>
  );
}

function formatHours(seconds) {
  return `${Math.round(seconds / 3600).toLocaleString()}h`;
}

export default function UserProfile({ user, compact = false }) {
  if (!user) return null;

  // Header: the player's banner, with avatar + name on the left and the
  // headline stats (global rank, pp) on the right, over a gradient that
  // darkens towards the bottom. Without a banner it's a plain dark gradient.
  const headerStyle = user.cover_url
    ? { backgroundImage: [
        // darker at both sides, where the name and the headline stats sit
        'linear-gradient(to right, rgb(17 24 39 / 0.6), transparent 35%, transparent 65%, rgb(17 24 39 / 0.6))',
        'linear-gradient(to bottom, rgb(17 24 39 / 0.15), rgb(17 24 39 / 0.9))',
        `url("${user.cover_url}")`,
      ].join(', ') }
    : undefined;

  const rank = user.stats.global_rank ? `#${user.stats.global_rank.toLocaleString()}` : 'N/A';
  const countryRank = user.stats.country_rank ? `#${user.stats.country_rank.toLocaleString()}` : 'N/A';
  const pp = Math.round(user.stats.pp).toLocaleString();
  const rankDelta = <RankDelta history={user.rank_history} currentRank={user.stats.global_rank} />;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div
        className={`flex items-end justify-between gap-4 bg-cover bg-center bg-gradient-to-br from-gray-900 to-gray-800 [text-shadow:0_1px_2px_rgb(0_0_0/0.8),0_2px_8px_rgb(0_0_0/0.5)] ${compact ? 'h-28 px-4 pb-3' : 'h-36 px-6 pb-4'}`}
        style={headerStyle}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar — links to osu! profile */}
          <Tooltip text={`View ${user.username}'s osu! profile`} placement="bottom" focusable={false} className="shrink-0">
            <a href={`https://osu.ppy.sh/users/${user.id}`} target="_blank" rel="noopener noreferrer">
              <img
                src={user.avatar_url}
                alt={user.username}
                className={`rounded-full border-2 border-white/80 hover:border-osu-pink transition cursor-pointer shadow-lg ${compact ? 'w-14 h-14' : 'w-20 h-20'}`}
              />
            </a>
          </Tooltip>
          <div className="min-w-0">
            <h2 className={`font-bold text-white truncate ${compact ? 'text-xl' : 'text-3xl'}`}>{user.username}</h2>
            <p className="text-gray-200 text-sm truncate">{user.country}</p>
          </div>
        </div>

        {/* Headline stats; on phones they move into the strip below */}
        <div className="hidden sm:flex items-end gap-6 shrink-0">
          <HeroStat label="Global Rank" extra={rankDelta} value={rank} compact={compact} />
          <HeroStat label="PP" value={pp} compact={compact} />
        </div>
      </div>

      {/* Secondary stats strip */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-y-3 sm:divide-x sm:divide-gray-700 ${compact ? 'px-4 py-3' : 'px-6 py-4'} sm:[&>*]:px-5 sm:[&>*:first-child]:pl-0`}>
        <Stat label="Country Rank" value={countryRank} />
        <Stat label="Accuracy" value={`${user.stats.accuracy}%`} />
        <Stat label="Play Count" value={user.playcount.toLocaleString()} />
        <Stat label="Play Time" value={formatHours(user.play_time || 0)} />
        {/* Phone only, shown first: on wider screens these are in the header.
            Kept last in the markup so the desktop dividers start at Country Rank. */}
        <Stat label="Global Rank" value={rank} className="sm:hidden order-first" />
        <Stat label="PP" value={pp} className="sm:hidden order-first" />
      </div>
    </div>
  );
}

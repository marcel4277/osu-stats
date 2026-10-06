import Tooltip from './Tooltip.jsx';

function RankDelta({ history, currentRank }) {
  if (!history || history.length < 2 || !currentRank) return null;
  const earliest = history.find(v => v > 0);
  if (!earliest) return null;
  const delta = earliest - currentRank; // positive = improved (rank number went down)
  if (delta === 0) return null;
  const improved = delta > 0;
  return (
    <span className={`text-xs font-semibold ${improved ? 'text-green-400' : 'text-red-400'}`}>
      {improved ? '▲' : '▼'}{Math.abs(delta).toLocaleString()}
      <span className="text-gray-500 font-normal"> · 90d</span>
    </span>
  );
}

function Stat({ label, value, children }) {
  return (
    <div className="min-w-0">
      <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-white text-xl font-bold truncate">{value}</p>
      {children}
    </div>
  );
}

export default function UserProfile({ user, compact = false }) {
  if (!user) return null;

  // Header: the player's banner with their avatar, name and country on its
  // lower half. The gradient darkens towards the bottom, where the text sits.
  // Without a banner the header is a plain dark gradient, same layout.
  const headerStyle = user.cover_url
    ? { backgroundImage: `linear-gradient(to bottom, rgb(17 24 39 / 0.15), rgb(17 24 39 / 0.9)), url("${user.cover_url}")` }
    : undefined;

  const rank = user.stats.global_rank ? `#${user.stats.global_rank.toLocaleString()}` : 'N/A';
  const countryRank = user.stats.country_rank ? `#${user.stats.country_rank.toLocaleString()}` : 'N/A';

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div
        className={`flex items-end bg-cover bg-center bg-gradient-to-br from-gray-900 to-gray-800 ${compact ? 'h-28 px-4 pb-3' : 'h-36 px-6 pb-4'}`}
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
          <div className="min-w-0 [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]">
            <h2 className={`font-bold text-white truncate ${compact ? 'text-xl' : 'text-3xl'}`}>{user.username}</h2>
            <p className="text-gray-200 text-sm truncate">
              {user.country} • {user.playcount.toLocaleString()} plays
            </p>
          </div>
        </div>
      </div>

      {/* Stats: neutral numbers, one row on desktop */}
      <div className={`grid grid-cols-2 gap-x-6 gap-y-4 ${compact ? 'p-4' : 'p-6 md:grid-cols-4'}`}>
        <Stat label="Global Rank" value={rank}>
          <RankDelta history={user.rank_history} currentRank={user.stats.global_rank} />
        </Stat>
        <Stat label="Country Rank" value={countryRank} />
        <Stat label="PP" value={Number(user.stats.pp).toLocaleString()} />
        <Stat label="Accuracy" value={`${user.stats.accuracy}%`} />
      </div>
    </div>
  );
}

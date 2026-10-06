import Tooltip from './Tooltip.jsx';

function RankDelta({ history, currentRank }) {
  if (!history || history.length < 2 || !currentRank) return null;
  const earliest = history.find(v => v > 0);
  if (!earliest) return null;
  const delta = earliest - currentRank; // positive = improved (rank number went down)
  if (delta === 0) return null;
  const improved = delta > 0;
  return (
    <span className={`text-sm font-semibold ${improved ? 'text-green-400' : 'text-red-400'}`}>
      {improved ? '▲' : '▼'}{Math.abs(delta).toLocaleString()}
    </span>
  );
}

export default function UserProfile({ user, compact = false }) {
  if (!user) return null;

  const hasBanner = Boolean(user.cover_url);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Profile banner as a 5:1 strip across the top, centred; a banner of a
          different shape is cropped a little at the edges. Fades into the
          card at the bottom edge. */}
      {hasBanner && (
        <div
          className="aspect-[5/1] bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to bottom, transparent 75%, rgb(31 41 55)), url("${user.cover_url}")` }}
        />
      )}

      <div className="p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
        {/* Avatar — links to osu! profile; overlaps the bottom of the banner */}
        <div className={`flex-shrink-0 ${hasBanner ? (compact ? '-mt-12' : '-mt-16') : ''}`}>
          <Tooltip text={`View ${user.username}'s osu! profile`} placement="bottom" focusable={false}>
            <a
              href={`https://osu.ppy.sh/users/${user.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={user.avatar_url}
                alt={user.username}
                className={`rounded-full border-2 border-osu-purple hover:border-osu-pink transition cursor-pointer bg-gray-800 ring-4 ring-gray-800 ${compact ? 'w-16 h-16' : 'w-24 h-24'}`}
              />
            </a>
          </Tooltip>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <h2 className={`font-bold text-white mb-1 truncate ${compact ? 'text-xl' : 'text-3xl mb-2'}`}>{user.username}</h2>
          <p className="text-gray-400 mb-3 text-sm truncate">
            {user.country} • {user.playcount.toLocaleString()} plays
          </p>

          {/* Stats Grid */}
          <div className={`grid grid-cols-2 gap-2 ${compact ? '' : 'md:grid-cols-4 gap-4'}`}>
            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-sm">Global Rank</p>
              <div className="flex items-center gap-x-2 flex-wrap">
                <p className="text-osu-cyan text-xl font-bold">
                  #{user.stats.global_rank ? user.stats.global_rank.toLocaleString() : 'N/A'}
                </p>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-gray-400 text-xs">90d</span>
                  <RankDelta history={user.rank_history} currentRank={user.stats.global_rank} />
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-sm">Country Rank</p>
              <p className="text-osu-pink text-xl font-bold">
                #{user.stats.country_rank ? user.stats.country_rank.toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-sm">PP</p>
              <p className="text-osu-purple text-xl font-bold">
                {user.stats.pp}
              </p>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-white text-xl font-bold">
                {user.stats.accuracy}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

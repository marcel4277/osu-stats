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

export default function UserProfile({ user }) {
  if (!user) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex gap-6 items-center">
      {/* Avatar — links to osu! profile */}
      <div className="flex-shrink-0">
        <a
          href={`https://osu.ppy.sh/users/${user.id}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`View ${user.username}'s osu! profile`}
        >
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-24 h-24 rounded-full border-2 border-osu-purple hover:border-osu-pink transition cursor-pointer"
          />
        </a>
      </div>

      {/* User Info */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold text-white mb-2">{user.username}</h2>
        <p className="text-gray-400 mb-4">
          {user.country} • {user.playcount.toLocaleString()} plays
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-400 text-sm">Global Rank</p>
            <div className="flex items-center gap-2">
              <p className="text-osu-cyan text-xl font-bold">
                #{user.stats.global_rank ? user.stats.global_rank.toLocaleString() : 'N/A'}
              </p>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-gray-600 text-xs">90d</span>
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
  );
}

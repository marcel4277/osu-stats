export default function ScoresList({ scores, username }) {
  if (!scores || scores.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center text-gray-400">
        No scores found
      </div>
    );
  }

  const handleRowClick = (beatmapset_id) => {
    window.open(`https://osu.ppy.sh/beatmapsets/${beatmapset_id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white">
          Best Scores for {username}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">#</th>
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">Beatmap</th>
              <th className="px-4 py-3 text-center text-gray-400 font-semibold">Accuracy</th>
              <th className="px-4 py-3 text-center text-gray-400 font-semibold">Score</th>
              <th className="px-4 py-3 text-center text-gray-400 font-semibold">Combo</th>
              <th className="px-4 py-3 text-center text-gray-400 font-semibold">PP</th>
              <th className="px-4 py-3 text-center text-gray-400 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr
                key={score.id}
                className="border-b border-gray-700 transition hover:bg-gray-700 cursor-pointer"
                onClick={() => handleRowClick(score.beatmapset_id)}
                title="Open beatmap in osu!"
              >
                <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-semibold">{score.title}</p>
                    <p className="text-sm text-gray-400">{score.artist}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-osu-purple bg-opacity-20 text-osu-pink px-3 py-1 rounded text-sm font-semibold">
                    {score.accuracy}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-white font-semibold">
                  {score.score.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">
                  {score.combo}x
                </td>
                <td className="px-4 py-3 text-center">
                  {score.pp != null
                    ? <span className="text-osu-cyan font-semibold">{score.pp.toLocaleString()}<span className="text-gray-500 text-xs font-normal">pp</span></span>
                    : <span className="text-gray-600">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-sm">
                  {new Date(score.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

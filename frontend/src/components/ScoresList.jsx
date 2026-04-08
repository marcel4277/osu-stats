import { useState } from 'react';

const COLUMNS = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'score',    label: 'Score'    },
  { key: 'combo',    label: 'Combo'    },
  { key: 'pp',       label: 'PP'       },
  { key: 'date',     label: 'Date'     },
];

function SortIcon({ direction }) {
  if (!direction) return <span className="ml-1 text-gray-600">⇅</span>;
  return <span className="ml-1 text-osu-pink">{direction === 'asc' ? '↑' : '↓'}</span>;
}

function sortScores(scores, key, direction) {
  if (!key) return scores;
  return [...scores].sort((a, b) => {
    let av = key === 'date' ? new Date(a.date).getTime() : Number(a[key] ?? -Infinity);
    let bv = key === 'date' ? new Date(b.date).getTime() : Number(b[key] ?? -Infinity);
    return direction === 'asc' ? av - bv : bv - av;
  });
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60)                    return 'Just now';
  if (seconds < 3600)                  return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400)                 return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 86400 * 30)           return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 86400 * 365)          return `${Math.floor(seconds / (86400 * 30))} months ago`;
  const years = Math.floor(seconds / (86400 * 365));
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Smooth HSL color based on accuracy: red (low) → orange → yellow → green → pink (100%)
function accuracyColor(accuracy) {
  const acc = parseFloat(accuracy);
  if (acc >= 100) return '#f472b6'; // pink
  if (acc >= 99)  return '#4ade80'; // green
  if (acc >= 97)  return '#86efac'; // light green
  if (acc >= 95)  return '#facc15'; // yellow
  if (acc >= 90)  return '#fb923c'; // orange
  return '#f87171';                 // red
}


export default function ScoresList({ scores, username }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  if (!scores || scores.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center text-gray-400">
        No scores found
      </div>
    );
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = sortScores(scores, sortKey, sortDir);

  const isLazer = (score) => score.score === 0;

  const handleRowClick = (score) => {
    if (isLazer(score)) return;
    const id = score.best_id;
    if (!id) return;
    const mode = typeof score.mode === 'number'
      ? ['osu', 'taiko', 'fruits', 'mania'][score.mode] ?? 'osu'
      : score.mode || 'osu';
    window.open(`https://osu.ppy.sh/scores/${mode}/${id}`, '_blank', 'noopener,noreferrer');
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
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-center text-gray-400 font-semibold cursor-pointer select-none hover:text-white transition"
                >
                  {col.label}<SortIcon direction={sortKey === col.key ? sortDir : null} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((score, index) => (
                <tr
                  key={score.id}
                  className={`border-b border-gray-700 transition ${isLazer(score) ? 'cursor-default' : 'hover:bg-gray-700 cursor-pointer'}`}
                  onClick={() => handleRowClick(score)}
                  title={isLazer(score) ? undefined : 'View score on osu!'}
                >
                  <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-semibold">{score.title}</p>
                      <p className="text-sm text-gray-400">{score.artist}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="px-3 py-1 rounded text-sm font-semibold bg-black bg-opacity-20"
                      style={{ color: accuracyColor(score.accuracy) }}
                    >
                      {score.accuracy}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-white font-semibold">
                    {score.score === 0
                      ? <span className="relative group inline-block bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-40 px-2 py-0.5 rounded text-xs font-semibold tracking-wide cursor-default">
                          lazer
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                            <span className="block bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                              osu! Lazer uses a different scoring system — legacy score not available
                            </span>
                          </span>
                        </span>
                      : score.score.toLocaleString()
                    }
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
                  <td className="px-4 py-3 text-center text-sm text-gray-400 relative group cursor-default">
                    {new Date(score.date).toLocaleDateString()}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <span className="block bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        {timeAgo(score.date)}
                      </span>
                    </span>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

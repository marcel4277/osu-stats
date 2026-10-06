import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import osuAPI from '../services/api.js';
import UsernameInput from '../components/UsernameInput.jsx';
import UserProfile from '../components/UserProfile.jsx';
import ScoresList from '../components/ScoresList.jsx';
import ImprovementVelocity from '../components/ImprovementVelocity.jsx';
import PlaystyleCard from '../components/PlaystyleCard.jsx';
import ComparisonView from '../components/ComparisonView.jsx';

async function fetchPlayer(username) {
  const [userData, scoresData] = await Promise.all([
    osuAPI.getUser(username),
    osuAPI.getUserScores(username, 'best'),
  ]);
  return { user: userData, scores: scoresData.scores };
}

// Loads a player whenever `username` changes. If the name changes again before
// the request finishes, the stale response is ignored so it can't overwrite the
// newer player.
function usePlayer(username) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPlayer(null);
    setError(null);
    if (!username) { setLoading(false); return; }

    let stale = false;
    setLoading(true);
    fetchPlayer(username)
      .then(data => { if (!stale) setPlayer(data); })
      .catch(err => { if (!stale) setError(err.response?.data?.message || err.message || 'Failed to fetch data'); })
      .finally(() => { if (!stale) setLoading(false); });

    return () => { stale = true; };
  }, [username]);

  return { player, loading, error };
}

function ErrorMessage({ message }) {
  return (
    <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
      <p className="font-semibold">Error</p>
      <p>{message}</p>
    </div>
  );
}

export default function HomePage() {
  const { username, username2 } = useParams();
  const navigate = useNavigate();

  const { player: player1, loading: loading1, error: error1 } = usePlayer(username);
  const { player: player2, loading: loading2, error: error2 } = usePlayer(username2);

  const handleSearch1 = (name) => {
    navigate(`/${encodeURIComponent(name.trim())}`);
  };

  const handleSearch2 = (name) => {
    if (!username) return;
    navigate(`/${encodeURIComponent(username)}/vs/${encodeURIComponent(name.trim())}`);
  };

  const isComparing = !!(player1 && player2);

  return (
    <div className="space-y-8">
      {/* Search area */}
      <div className="flex flex-col items-center gap-3">
        <UsernameInput onSearch={handleSearch1} isLoading={loading1} />

        {player1 && (
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="flex-1 border-t border-gray-700" />
            <span className="text-gray-400 text-xs uppercase tracking-widest">vs</span>
            <div className="flex-1 border-t border-gray-700" />
          </div>
        )}
        {player1 && (
          <UsernameInput onSearch={handleSearch2} isLoading={loading2} placeholder="Compare with..." secondary />
        )}
      </div>

      {error1 && <ErrorMessage message={error1} />}
      {error2 && <ErrorMessage message={error2} />}

      {/* Comparison view */}
      {isComparing && (
        <ComparisonView
          user1={player1.user}   scores1={player1.scores}
          user2={player2.user}   scores2={player2.scores}
        />
      )}

      {/* Single player view */}
      {player1 && !isComparing && (
        <div className="space-y-6">
          <UserProfile user={player1.user} />
          <ImprovementVelocity scores={player1.scores} />
          <PlaystyleCard scores={player1.scores} />
          {Array.isArray(player1.scores) && player1.scores.length > 0 ? (
            <ScoresList scores={player1.scores} username={player1.user.username} />
          ) : (
            <div className="rounded-3xl border border-gray-700 bg-gray-900 p-6 text-center text-gray-400">
              <p className="font-semibold text-white">No scores found</p>
              <p className="mt-2 text-sm text-gray-400">This user has no scores or they are not public.</p>
            </div>
          )}
        </div>
      )}

      {!username && !loading1 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Search for an osu! player to get started</p>
          <p className="text-sm text-gray-400">Try: fieryrage, cookiezi, hvick225</p>
        </div>
      )}

      {loading1 && (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-osu-purple"></div>
          </div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      )}

      {loading2 && !player2 && (
        <div className="text-center py-4">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-osu-purple"></div>
          </div>
          <p className="text-gray-400 mt-2 text-sm">Loading...</p>
        </div>
      )}
    </div>
  );
}

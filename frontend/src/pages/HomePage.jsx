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

export default function HomePage() {
  const { username, username2 } = useParams();
  const navigate = useNavigate();

  const [player1, setPlayer1] = useState(null);
  const [loading1, setLoading1] = useState(false);
  const [error1, setError1]   = useState(null);

  const [player2, setPlayer2] = useState(null);
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2]   = useState(null);

  // Load player 1 when username param changes
  useEffect(() => {
    if (!username) { setPlayer1(null); return; }
    setLoading1(true);
    setError1(null);
    setPlayer1(null);
    fetchPlayer(username)
      .then(setPlayer1)
      .catch(err => setError1(err.response?.data?.message || err.message || 'Failed to fetch data'))
      .finally(() => setLoading1(false));
  }, [username]);

  // Load player 2 when username2 param changes
  useEffect(() => {
    if (!username2) { setPlayer2(null); return; }
    setLoading2(true);
    setError2(null);
    setPlayer2(null);
    fetchPlayer(username2)
      .then(setPlayer2)
      .catch(err => setError2(err.response?.data?.message || err.message || 'Failed to fetch data'))
      .finally(() => setLoading2(false));
  }, [username2]);

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
            <span className="text-gray-600 text-xs uppercase tracking-widest">vs</span>
            <div className="flex-1 border-t border-gray-700" />
          </div>
        )}
        {player1 && (
          <UsernameInput onSearch={handleSearch2} isLoading={loading2} placeholder="Compare with..." />
        )}
      </div>

      {error1 && (
        <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
          <p className="font-semibold">Error</p>
          <p>{error1}</p>
        </div>
      )}
      {error2 && (
        <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
          <p className="font-semibold">Error</p>
          <p>{error2}</p>
        </div>
      )}

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
              <p className="mt-2 text-sm text-gray-500">This user has no scores or they are not public.</p>
            </div>
          )}
        </div>
      )}

      {!username && !loading1 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Search for an osu! player to get started</p>
          <p className="text-sm text-gray-500">Try: fieryrage, cookiezi, hvick225</p>
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

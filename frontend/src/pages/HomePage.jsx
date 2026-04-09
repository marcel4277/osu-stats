import { useState } from 'react';
import osuAPI from '../services/api.js';
import UsernameInput from '../components/UsernameInput.jsx';
import UserProfile from '../components/UserProfile.jsx';
import ScoresList from '../components/ScoresList.jsx';
import ImprovementVelocity from '../components/ImprovementVelocity.jsx';
import PlaystyleCard from '../components/PlaystyleCard.jsx';
import ComparisonView from '../components/ComparisonView.jsx';

export default function HomePage() {
  const [user, setUser]       = useState(null);
  const [scores, setScores]   = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [user2, setUser2]     = useState(null);
  const [scores2, setScores2] = useState(null);
  const [isLoading2, setIsLoading2] = useState(false);
  const [error2, setError2]   = useState(null);

  const isComparing = !!(user && user2);

  const handleSearch = async (username) => {
    setIsLoading(true);
    setError(null);
    setUser(null);
    setScores(null);
    // reset compare when a new player 1 is searched
    setUser2(null);
    setScores2(null);
    setError2(null);

    try {
      const [userData, scoresData] = await Promise.all([
        osuAPI.getUser(username),
        osuAPI.getUserScores(username, 'best'),
      ]);
      setUser(userData);
      setScores(scoresData.scores);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch2 = async (username) => {
    setIsLoading2(true);
    setError2(null);
    setUser2(null);
    setScores2(null);

    try {
      const [userData, scoresData] = await Promise.all([
        osuAPI.getUser(username),
        osuAPI.getUserScores(username, 'best'),
      ]);
      setUser2(userData);
      setScores2(scoresData.scores);
    } catch (err) {
      setError2(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setIsLoading2(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Player 1 search */}
      <div className="mb-8 flex justify-center">
        <UsernameInput onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Comparison view */}
      {isComparing && (
        <ComparisonView
          user1={user}   scores1={scores}
          user2={user2}  scores2={scores2}
        />
      )}

      {/* Single player view */}
      {user && !isComparing && (
        <div className="space-y-6">
          <UserProfile user={user} />
          <ImprovementVelocity scores={scores} />
          <PlaystyleCard scores={scores} />
          {Array.isArray(scores) && scores.length > 0 ? (
            <ScoresList scores={scores} username={user.username} />
          ) : (
            <div className="rounded-3xl border border-gray-700 bg-gray-900 p-6 text-center text-gray-400">
              <p className="font-semibold text-white">No scores found</p>
              <p className="mt-2 text-sm text-gray-500">This user has no scores or they are not public.</p>
            </div>
          )}
        </div>
      )}

      {/* Compare search — shown after player 1 loaded, before player 2 */}
      {user && !isComparing && (
        <div className="border-t border-gray-700 pt-6">
          <p className="text-center text-gray-500 text-sm mb-4">Compare with another player</p>
          <div className="flex justify-center">
            <UsernameInput onSearch={handleSearch2} isLoading={isLoading2} />
          </div>
          {error2 && (
            <div className="mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
              <p className="font-semibold">Error</p>
              <p>{error2}</p>
            </div>
          )}
        </div>
      )}

      {/* Compare search while comparing — allow swapping player 2 */}
      {isComparing && (
        <div className="border-t border-gray-700 pt-6">
          <p className="text-center text-gray-500 text-sm mb-4">Change comparison player</p>
          <div className="flex justify-center">
            <UsernameInput onSearch={handleSearch2} isLoading={isLoading2} />
          </div>
          {error2 && (
            <div className="mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
              <p className="font-semibold">Error</p>
              <p>{error2}</p>
            </div>
          )}
        </div>
      )}

      {!user && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Search for an osu! player to get started</p>
          <p className="text-sm text-gray-500">Try: fieryrage, cookiezi, hvick225</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-osu-purple"></div>
          </div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      )}

      {isLoading2 && (
        <div className="text-center py-4">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-osu-purple"></div>
          </div>
          <p className="text-gray-400 mt-2 text-sm">Loading player 2...</p>
        </div>
      )}
    </div>
  );
}

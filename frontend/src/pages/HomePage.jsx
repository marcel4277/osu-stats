import { useState } from 'react';
import osuAPI from '../services/api.js';
import UsernameInput from '../components/UsernameInput.jsx';
import UserProfile from '../components/UserProfile.jsx';
import ScoresList from '../components/ScoresList.jsx';
import ImprovementVelocity from '../components/ImprovementVelocity.jsx';
import PlaystyleCard from '../components/PlaystyleCard.jsx';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (username) => {
    setIsLoading(true);
    setError(null);
    setUser(null);
    setScores(null);

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

  return (
    <div className="space-y-8">
      <div className="mb-8 flex justify-center">
        <UsernameInput onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {user && (
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
    </div>
  );
}

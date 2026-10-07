import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import osuAPI, { errorMessage } from '../services/api.js';
import UsernameInput from '../components/UsernameInput.jsx';
import UserProfile from '../components/UserProfile.jsx';
import ScoresList from '../components/ScoresList.jsx';
import ImprovementVelocity from '../components/ImprovementVelocity.jsx';
import PlaystyleCard from '../components/PlaystyleCard.jsx';
import ComparisonView from '../components/ComparisonView.jsx';
import UpdatedNote from '../components/UpdatedNote.jsx';

async function fetchPlayer(username, options) {
  const [userData, scoresData] = await Promise.all([
    osuAPI.getUser(username, options),
    osuAPI.getUserScores(username, 'best', options),
  ]);
  // The older of the two, so "Updated … ago" never makes the data look newer than it is
  const fetchedAt = [userData.fetched_at, scoresData.fetched_at].filter(Boolean).sort()[0] ?? null;
  return { user: userData, scores: scoresData.scores, fetchedAt };
}

// Loads a player whenever `username` changes. If the name changes again before
// the request finishes, the stale response is ignored so it can't overwrite the
// newer player.
//
// Results are stored with the name they belong to, so on the render right
// after the name changes (before the effect runs) the old player isn't shown,
// and it counts as loading until a result for the new name arrives.
//
// refresh() asks for new data from osu! while the current data stays on
// screen. If it fails, the current data stays and a short note replaces
// "Updated … ago". Whatever the cause (osu! busy or down), the advice is the
// same, and a short line fits on one line above the card, even on phones.
function usePlayer(username) {
  const [result, setResult] = useState({ name: null, player: null, error: null });
  const [refreshState, setRefreshState] = useState({ name: null, refreshing: false, error: null });

  useEffect(() => {
    setResult({ name: null, player: null, error: null });
    setRefreshState({ name: null, refreshing: false, error: null });
    if (!username) return;

    let stale = false;
    fetchPlayer(username)
      .then(player => { if (!stale) setResult({ name: username, player, error: null }); })
      .catch(err => {
        if (!stale) setResult({ name: username, player: null, error: errorMessage(err) });
      });

    return () => { stale = true; };
  }, [username]);

  const refresh = useCallback(() => {
    // Only applied if the same player is still on screen when it arrives
    const sameName = state => state.name === username;
    setRefreshState({ name: username, refreshing: true, error: null });
    fetchPlayer(username, { refresh: true })
      .then(player => {
        setResult(r => (sameName(r) ? { name: username, player, error: null } : r));
        setRefreshState(s => (sameName(s) ? { name: username, refreshing: false, error: null } : s));
      })
      .catch(() => {
        setRefreshState(s => (sameName(s) ? { name: username, refreshing: false, error: "Couldn't refresh. Try again in a minute." } : s));
      });
  }, [username]);

  const current = result.name === username;
  const refreshCurrent = refreshState.name === username;
  return {
    player: current ? result.player : null,
    loading: !!username && !current,
    error: current ? result.error : null,
    refresh,
    refreshing: refreshCurrent && refreshState.refreshing,
    refreshError: refreshCurrent ? refreshState.error : null,
  };
}

function ErrorMessage({ message }) {
  return (
    <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
      <p className="font-semibold">Error</p>
      <p>{message}</p>
    </div>
  );
}

export default function HomePage({ onComparingChange }) {
  const { username, username2 } = useParams();
  const navigate = useNavigate();

  const p1 = usePlayer(username);
  const p2 = usePlayer(username2);
  const { player: player1, loading: loading1, error: error1 } = p1;
  const { player: player2, loading: loading2, error: error2 } = p2;
  // "Updated … ago · Refresh", above each player card
  const note = p => (
    <UpdatedNote fetchedAt={p.player?.fetchedAt} onRefresh={p.refresh} refreshing={p.refreshing} error={p.refreshError} />
  );

  const handleSearch1 = (name) => {
    navigate(`/${encodeURIComponent(name.trim())}`);
  };

  const handleSearch2 = (name) => {
    if (!username) return;
    navigate(`/${encodeURIComponent(username)}/vs/${encodeURIComponent(name.trim())}`);
  };

  // Split into two columns as soon as a second player is searched, with a
  // placeholder in their column until they load. If they fail to load, the
  // page falls back to the single-player view.
  const isComparing = !!(player1 && username2 && !error2);

  // Tell the page to widen; a layout effect so it happens before the browser
  // paints, and the split never shows at the old width (or the other way round)
  useLayoutEffect(() => { onComparingChange?.(isComparing); }, [isComparing, onComparingChange]);

  return (
    <div className="space-y-8">
      {/* Search area */}
      <div className="flex flex-col items-center gap-3">
        <UsernameInput value={username ?? ''} onSearch={handleSearch1} isLoading={loading1} />

        {player1 && (
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="flex-1 border-t border-gray-700" />
            <span className="text-gray-400 text-xs uppercase tracking-widest">vs</span>
            <div className="flex-1 border-t border-gray-700" />
          </div>
        )}
        {player1 && (
          <UsernameInput value={username2 ?? ''} onSearch={handleSearch2} isLoading={loading2} placeholder="Compare with..." secondary />
        )}
      </div>

      {/* Comparison view */}
      {isComparing && (
        <ComparisonView
          user1={player1.user}         scores1={player1.scores}
          user2={player2?.user}        scores2={player2?.scores}
          name2={username2}
          note1={note(p1)}             note2={player2 ? note(p2) : null}
        />
      )}

      {error1 && <ErrorMessage message={error1} />}
      {error2 && <ErrorMessage message={error2} />}

      {/* Single player view */}
      {player1 && !isComparing && (
        <div className="space-y-6">
          <div className="space-y-2">
            {note(p1)}
            <UserProfile user={player1.user} />
          </div>
          <ImprovementVelocity scores={player1.scores} />
          <PlaystyleCard scores={player1.scores} />
          {Array.isArray(player1.scores) && player1.scores.length > 0 ? (
            <ScoresList scores={player1.scores} username={player1.user.username} />
          ) : (
            <div className="rounded-3xl border border-gray-700 bg-gray-900 p-6 text-center text-gray-400">
              <p className="font-semibold text-white">No top plays found</p>
              <p className="mt-2 text-sm text-gray-400">This player doesn't have any top plays yet.</p>
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
    </div>
  );
}

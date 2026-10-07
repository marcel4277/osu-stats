import { useEffect, useState } from 'react';

// How old the player's data is, with a button to get it fresh from osu!.
// The backend keeps osu! data for 30 minutes, so without this a play set a
// few minutes ago could be missing with no hint why.
//
// The button only appears once the data is a minute old: the backend
// wouldn't fetch anything newer before then anyway.

const MINUTE = 60 * 1000;

function ageText(ms) {
  const minutes = Math.floor(ms / MINUTE);
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
}

// Re-renders each time the data's age reaches a new whole minute, so the
// text and the button change at the right moment (a fixed 30-second tick
// could be up to 30 seconds late)
function useNow(fetchedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!fetchedAt) return undefined;
    const start = new Date(fetchedAt).getTime();
    let id;
    const schedule = () => {
      const age = Math.max(0, Date.now() - start);
      id = setTimeout(() => { setNow(Date.now()); schedule(); }, MINUTE - (age % MINUTE) + 50);
    };
    setNow(Date.now());
    schedule();
    return () => clearTimeout(id);
  }, [fetchedAt]);
  return now;
}

function RefreshIcon({ spinning }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
      className={`w-3.5 h-3.5 shrink-0 ${spinning ? 'animate-spin' : ''}`}>
      <path fillRule="evenodd" d="M15.31 4.69a7 7 0 00-11.03 1.6 1 1 0 101.74.98 5 5 0 017.88-1.15l-1.6 1.6a.5.5 0 00.35.86H17a.5.5 0 00.5-.5V2.73a.5.5 0 00-.85-.36l-1.34 1.34zM15.72 12.75a1 1 0 00-1.36.38 5 5 0 01-7.87 1.15l1.6-1.6a.5.5 0 00-.36-.86H3a.5.5 0 00-.5.5v4.35c0 .44.54.67.85.36l1.34-1.34a7 7 0 0011.03-1.6 1 1 0 00-.38-1.34z" clipRule="evenodd" />
    </svg>
  );
}

export default function UpdatedNote({ fetchedAt, onRefresh, refreshing, error, className = '' }) {
  const now = useNow(fetchedAt);
  if (!fetchedAt) return null;
  const age = Math.max(0, now - new Date(fetchedAt).getTime());

  return (
    <div className={`flex items-center justify-end gap-2 text-xs text-gray-400 min-w-0 ${className}`}>
      {error
        // Wraps rather than cutting off: the reason is the whole point
        ? <span className="text-red-300 text-right">{error}</span>
        : <span className="truncate">{refreshing ? 'Refreshing…' : ageText(age)}</span>}
      {(age >= MINUTE || refreshing || error) && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 -mr-1.5 text-gray-300 hover:text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-default"
        >
          <RefreshIcon spinning={refreshing} />
          Refresh
        </button>
      )}
    </div>
  );
}

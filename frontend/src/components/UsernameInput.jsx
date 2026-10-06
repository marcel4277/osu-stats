import { useEffect, useState } from 'react';

// value: the name currently on screen (from the page address). The box resets
// to it whenever it changes, so going back/forward or opening a shared link
// never leaves an old name in the box.
// secondary: an outlined button, for the compare search, so the main search
// stays the primary action
export default function UsernameInput({ value = '', onSearch, isLoading, placeholder = 'Enter osu! username...', secondary = false }) {
  const [username, setUsername] = useState(value);
  useEffect(() => { setUsername(value); }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(username);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-osu-purple focus:outline-none transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
            secondary
              ? 'border border-osu-purple text-purple-300 hover:bg-osu-purple/15'
              : 'bg-osu-purple hover:bg-osu-pink text-white'
          }`}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}

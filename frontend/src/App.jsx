import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import osuAPI from './services/api.js';
import './App.css';

export default function App() {
  const [visitors, setVisitors] = useState(null);

  useEffect(() => {
    // Count once per browser session
    if (sessionStorage.getItem('visited')) {
      osuAPI.getVisits().then(setVisitors).catch(() => {});
    } else {
      sessionStorage.setItem('visited', '1');
      osuAPI.recordVisit().then(setVisitors).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-osu-darker via-osu-dark to-osu-darker">
      <header className="border-b border-gray-700 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-osu-purple to-osu-cyan bg-clip-text text-transparent mb-2">
              osu! Stats
            </h1>
            <p className="text-gray-400">Search osu! users and view their stats</p>
          </div>

          {visitors !== null && (
            <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1" title="Total site visits">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3C5 3 1.73 7.11 1.05 9.78a1 1 0 000 .44C1.73 12.89 5 17 10 17s8.27-4.11 8.95-6.78a1 1 0 000-.44C18.27 7.11 15 3 10 3zm0 11a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span>{visitors.toLocaleString()}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:username" element={<HomePage />} />
          <Route path="/:username/vs/:username2" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-700 mt-12 py-6 text-center text-gray-500 text-sm">
        <p>Built with React, Vite, and Tailwind CSS &mdash; <a href="https://github.com/marcel4277/osu-stats" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition underline underline-offset-2">source on GitHub</a></p>
      </footer>
    </div>
  );
}

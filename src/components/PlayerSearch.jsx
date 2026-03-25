import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import PlayerDetailCard from './PlayerDetailCard';

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setIsLoading(true);
    try {
      const resp = await fetch(
        `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(q)}&sportId=1&active=true&limit=8`
      );
      const data = await resp.json();
      const people = (data.people || []).map((p) => ({
        id: p.id,
        name: p.fullName,
        team: p.currentTeam?.abbreviation || '',
        position: p.primaryPosition?.abbreviation || '',
        number: p.primaryNumber || '',
      }));
      setResults(people);
    } catch {
      setResults([]);
    }
    setIsLoading(false);
  };

  const handleInput = (val) => {
    setQuery(val);
    setSelectedPlayerId(null);
    setIsOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const selectPlayer = (player) => {
    setSelectedPlayerId(player.id);
    setQuery(player.name);
    setResults([]);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setSelectedPlayerId(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-white/10 rounded-lg px-2.5 py-1.5 gap-1.5">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search players..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-28 sm:w-40"
        />
        {query && (
          <button onClick={clear} className="text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (results.length > 0 || isLoading) && !selectedPlayerId && (
        <div className="absolute top-full mt-1 right-0 w-64 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-3 text-xs text-gray-500">Searching...</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPlayer(p)}
                className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[10px] text-gray-500">
                    #{p.number} {p.position}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{p.team}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Player detail modal */}
      {selectedPlayerId && (
        <div className="absolute top-full mt-1 right-0 w-[380px] sm:w-[480px] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center px-3 pt-2">
            <span className="text-xs text-gray-500">Player Details</span>
            <button onClick={clear} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <PlayerDetailCard playerId={selectedPlayerId} />
        </div>
      )}
    </div>
  );
}

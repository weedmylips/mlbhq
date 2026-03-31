import { useNavigate, useParams } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { getTeamsByDivision, divisionOrder } from '../data/teams';

export default function TeamSelector() {
  const { selectedTeamId, setSelectedTeamId } = useTeam();
  const navigate = useNavigate();
  const { tab } = useParams();
  const grouped = getTeamsByDivision();

  return (
    <div className="sticky top-0 z-50 bg-surface border-b border-border py-2 px-4">
      <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
        {divisionOrder.map((div, di) => (
          <div key={div} className="flex items-center gap-1 shrink-0">
            {di > 0 && (
              <div className="flex flex-col items-center mx-1">
                <div className="w-px h-8 bg-gray-700" />
                <span className="text-[9px] text-gray-600 whitespace-nowrap mt-0.5">
                  {div}
                </span>
              </div>
            )}
            {di === 0 && (
              <span className="text-[9px] text-gray-600 whitespace-nowrap mr-1">
                {div}
              </span>
            )}
            {grouped[div].map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTeamId(t.id); navigate(`/${t.abbr}/${tab || 'overview'}`); }}
                title={t.name}
                className={`flex flex-col items-center p-1 rounded-lg transition-all duration-300 hover:bg-white/5 shrink-0 ${
                  selectedTeamId === t.id ? 'team-glow ring-2 ring-[var(--team-primary)] bg-white/10' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center p-0.5">
                  <img
                    src={t.logo}
                    alt={t.abbr}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5">{t.abbr}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

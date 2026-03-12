import { useTeam } from '../context/TeamContext';
import { Newspaper } from 'lucide-react';

export default function NewsFeed() {
  const { team } = useTeam();

  return (
    <div className="card col-span-3">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Newspaper size={14} />
        {team.name} News
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <a
            key={i}
            href={`https://www.mlb.com/${team.abbr.toLowerCase()}/news`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <img src={team.logo} alt="" className="w-5 h-5" />
              <span className="text-xs text-gray-500">{team.abbr} News</span>
            </div>
            <p className="text-sm text-gray-300">
              Visit MLB.com for the latest {team.name} news, scores, and updates.
            </p>
            <span className="text-xs text-[var(--team-accent)] mt-2 block">
              Read more &rarr;
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

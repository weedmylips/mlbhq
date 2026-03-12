import { useTeam } from '../context/TeamContext';
import { useNews } from '../hooks/useTeamData';
import { Newspaper } from 'lucide-react';

function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ArticleCard({ article, team }) {
  const hasThumbnail = !!article.thumbnail;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
    >
      <div className="h-28 overflow-hidden bg-black/20 flex items-center justify-center shrink-0">
        {hasThumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center"
          style={{ display: hasThumbnail ? 'none' : 'flex' }}
        >
          <img src={team.logo} alt="" className="w-10 h-10 opacity-20" />
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <img src={team.logo} alt="" className="w-4 h-4" />
          <span className="text-xs text-gray-500">{relativeTime(article.pubDate)}</span>
        </div>
        <p className="text-sm text-gray-200 font-medium leading-snug line-clamp-2 mb-1">
          {article.title}
        </p>
        {article.summary && (
          <p className="text-xs text-gray-500 line-clamp-2 flex-1">{article.summary}</p>
        )}
        <span className="text-xs mt-2 block" style={{ color: 'var(--team-accent)' }}>
          Read more &rarr;
        </span>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white/5 rounded-lg overflow-hidden">
      <div className="skeleton h-28 w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
    </div>
  );
}

export default function NewsFeed() {
  const { team, selectedTeamId } = useTeam();
  const { data: articles, isLoading, isError } = useNews(selectedTeamId);

  return (
    <div className="card col-span-3">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Newspaper size={14} />
        {team.name} News
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
        ) : isError || !articles?.length ? (
          <a
            href={`https://www.mlb.com/${team.abbr.toLowerCase()}/news`}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-4 flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <img src={team.logo} alt="" className="w-8 h-8" />
            <div>
              <p className="text-sm text-gray-300">
                Visit MLB.com for the latest {team.name} news
              </p>
              <span className="text-xs mt-1 block" style={{ color: 'var(--team-accent)' }}>
                mlb.com/{team.abbr.toLowerCase()}/news &rarr;
              </span>
            </div>
          </a>
        ) : (
          articles.slice(0, 4).map((article, i) => (
            <ArticleCard key={article.link || i} article={article} team={team} />
          ))
        )}
      </div>
    </div>
  );
}

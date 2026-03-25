import { useHighlights } from '../hooks/useTeamData';
import { Play } from 'lucide-react';

export default function Highlights({ gamePk }) {
  const { data: highlights, isLoading } = useHighlights(gamePk);

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="skeleton h-16 w-full rounded" />
      </div>
    );
  }

  if (!highlights?.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-2">
        Highlights
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {highlights.map((h) => (
          <a
            key={h.id}
            href={h.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 group w-36 block"
          >
            <div className="relative rounded overflow-hidden bg-white/5 aspect-video">
              {h.thumbnail ? (
                <img
                  src={h.thumbnail}
                  alt={h.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play size={20} className="text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={24} className="text-white" fill="white" />
              </div>
              {h.duration && (
                <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/70 text-white px-1 rounded">
                  {h.duration}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight group-hover:text-gray-300 transition-colors">
              {h.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

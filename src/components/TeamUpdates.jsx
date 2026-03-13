import { useEffect, useRef } from 'react';
import { useTeam } from '../context/TeamContext';
import { Twitter } from 'lucide-react';

const TEAM_HANDLES = {
  147: 'Yankees',
  111: 'RedSox',
  141: 'BlueJays',
  110: 'Orioles',
  139: 'RaysBaseball',
  145: 'whitesox',
  114: 'CleGuardians',
  116: 'tigers',
  118: 'Royals',
  142: 'Twins',
  117: 'astros',
  108: 'Angels',
  133: 'Athletics',
  136: 'Mariners',
  140: 'Rangers',
  144: 'Braves',
  146: 'Marlins',
  121: 'Mets',
  143: 'Phillies',
  120: 'Nationals',
  112: 'Cubs',
  113: 'Reds',
  158: 'Brewers',
  138: 'Cardinals',
  134: 'Pirates',
  109: 'Dbacks',
  115: 'Rockies',
  119: 'Dodgers',
  135: 'Padres',
  137: 'SFGiants',
};

export default function TeamUpdates() {
  const { team } = useTeam();
  const handle = TEAM_HANDLES[team.id];
  const containerRef = useRef(null);

  useEffect(() => {
    if (!handle || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    const createWidget = () => {
      if (!containerRef.current) return;
      window.twttr.widgets.createTimeline(
        { sourceType: 'profile', screenName: handle },
        containerRef.current,
        {
          theme: 'dark',
          chrome: 'noheader nofooter noborders transparent',
          tweetLimit: 5,
          dnt: true,
        }
      );
    };

    if (!window.twttr) {
      window.twttr = { _e: [], ready: (f) => window.twttr._e.push(f) };
    }

    window.twttr.ready(createWidget);

    if (!document.getElementById('twitter-widget-script')) {
      const script = document.createElement('script');
      script.id = 'twitter-widget-script';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [team.id, handle]);

  return (
    <div className="card overflow-hidden">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Twitter size={14} />
        Team Updates
      </h3>
      {handle ? (
        <div ref={containerRef} className="min-h-[200px] flex items-center justify-center">
          <span className="text-gray-600 text-xs">Loading updates&hellip;</span>
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">No feed available.</p>
      )}
    </div>
  );
}

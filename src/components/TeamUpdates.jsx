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
    if (!handle) return;

    const load = () => window.twttr?.widgets?.load(containerRef.current);

    if (window.twttr) {
      load();
    } else if (!document.getElementById('twitter-widget-script')) {
      const script = document.createElement('script');
      script.id = 'twitter-widget-script';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = load;
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
        <div ref={containerRef} key={team.id}>
          <a
            className="twitter-timeline"
            href={`https://twitter.com/${handle}`}
            data-theme="dark"
            data-chrome="noheader nofooter noborders transparent"
            data-tweet-limit="5"
          >
            Loading {team.name} updates&hellip;
          </a>
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">No feed available.</p>
      )}
    </div>
  );
}

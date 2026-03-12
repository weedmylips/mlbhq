import { useWeather } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { Cloud, Thermometer, Wind, Droplets } from 'lucide-react';

export default function WeatherWidget() {
  const { team } = useTeam();
  const { data, isLoading } = useWeather(
    team.stadiumLat,
    team.stadiumLng,
    team.stadium
  );

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  if (!data || data.unavailable) {
    return (
      <div className="card">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Cloud size={14} />
          Stadium Weather
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">
          {data?.unavailable
            ? 'Set OPENWEATHER_API_KEY in .env'
            : 'Weather unavailable'}
        </p>
        <p className="text-xs text-gray-600 text-center">{team.stadium}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
        Stadium Weather
      </h3>
      <p className="text-xs text-gray-500 mb-3">{data.venue}</p>
      <div className="flex items-center gap-3 mb-3">
        <img
          src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
          alt={data.condition}
          className="w-12 h-12"
        />
        <div>
          <div className="stat-number text-2xl">{data.temp}&deg;F</div>
          <div className="text-xs text-gray-400">{data.condition}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Thermometer size={12} />
          Feels {data.feelsLike}&deg;F
        </div>
        <div className="flex items-center gap-1">
          <Wind size={12} />
          {data.wind} mph
        </div>
        <div className="flex items-center gap-1">
          <Droplets size={12} />
          {data.humidity}% humidity
        </div>
      </div>
    </div>
  );
}

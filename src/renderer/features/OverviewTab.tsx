import { storage } from '../lib/storage';
import { Zap } from 'lucide-react';
import { WeatherIcon } from '../components/WeatherIcon';
import { formatDateShort } from '../lib/date';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  'bgColor' | 'charging' | 'percent' | 'weather' | 'textColor' | 'time'
>;
export function OverviewTab({ bgColor, charging, percent, weather, textColor, time }: Props) {
  return (
    <>
      <div id="battery" style={{ animation: 'none' }}>
        <div
          id="battery-bar"
          style={{
            backgroundColor: storage.getItem('text-color') ?? undefined,
            color: bgColor,
          }}
        >
          <h1
            className="text"
            style={{ animation: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            {charging && <Zap size={16} />}
            <span>{percent}%</span>
          </h1>
        </div>
      </div>
      <h1
        className="text"
        style={{
          fontSize: 15,
          left: 25,
          top: 14,
          position: 'absolute',
          animation: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <WeatherIcon status={weather.status} size={16} color={textColor} />
          <span>{weather.temp ? weather.temp : '??'}º</span>
        </div>
      </h1>
      <div id="date">
        <h1 className="text" style={{ fontSize: 50, animation: 'none' }}>
          {time}
        </h1>
        <h2 className="text" style={{ fontSize: 15, animation: 'none' }}>
          {formatDateShort()}
        </h2>
      </div>
    </>
  );
}

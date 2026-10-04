import { Sun } from 'lucide-react';
import { CloudSun } from 'lucide-react';
import { Cloud } from 'lucide-react';
import { CloudRain } from 'lucide-react';
import { CloudSnow } from 'lucide-react';
import { CloudLightning } from 'lucide-react';
export const WeatherIcon = ({
  status,
  size = 16,
  color = 'currentColor',
}: {
  status?: string;
  size?: number;
  color?: string;
}) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('sunny') || s.includes('clear')) return <Sun size={size} color={color} />;
  if (s.includes('partly cloudy')) return <CloudSun size={size} color={color} />;
  if (s.includes('cloudy') || s.includes('overcast') || s.includes('mist') || s.includes('fog'))
    return <Cloud size={size} color={color} />;
  if (s.includes('rain') || s.includes('drizzle') || s.includes('showers'))
    return <CloudRain size={size} color={color} />;
  if (s.includes('snow') || s.includes('sleet') || s.includes('ice') || s.includes('blizzard'))
    return <CloudSnow size={size} color={color} />;
  if (s.includes('thunder') || s.includes('storm'))
    return <CloudLightning size={size} color={color} />;
  return <Sun size={size} color={color} />;
};

export interface WeatherReading {
  temp: number;
  status: string;
}

type WeatherFetcher = (input: URL) => Promise<Pick<Response, 'ok' | 'json'>>;

const WEATHER_API_KEY = '0b18c67c443543e0a6045401250911';

function parseWeatherReading(payload: unknown, unit: 'f' | 'c'): WeatherReading | null {
  if (typeof payload !== 'object' || payload === null || !('current' in payload)) return null;

  const currentValue = payload.current;
  if (typeof currentValue !== 'object' || currentValue === null) return null;
  const current = currentValue as Record<string, unknown>;
  const temperature = current[unit === 'f' ? 'temp_f' : 'temp_c'];
  const condition = current.condition;
  if (typeof condition !== 'object' || condition === null || !('text' in condition)) return null;

  const status = condition.text;
  if (
    typeof temperature !== 'number' ||
    !Number.isFinite(temperature) ||
    typeof status !== 'string'
  )
    return null;

  return { temp: Math.round(temperature), status };
}

export async function fetchCurrentWeather(
  location: string,
  unit: 'f' | 'c',
  fetcher: WeatherFetcher = fetch,
): Promise<WeatherReading | null> {
  const query = location.trim();
  if (!query) return null;

  const url = new URL('https://api.weatherapi.com/v1/current.json');
  url.searchParams.set('key', WEATHER_API_KEY);
  url.searchParams.set('q', query);
  url.searchParams.set('aqi', 'no');

  const response = await fetcher(url);
  if (!response.ok) return null;
  return parseWeatherReading(await response.json(), unit);
}

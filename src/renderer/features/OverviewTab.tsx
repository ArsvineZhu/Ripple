import { useTranslation } from 'react-i18next';
import styles from './OverviewTab.module.css';
import typography from '../styles/typography.module.css';
import { Zap } from 'lucide-react';
import { WeatherIcon } from '../components/WeatherIcon';
import { formatDateShort } from '../lib/date';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  'bgColor' | 'charging' | 'percent' | 'weather' | 'textColor' | 'time' | 'timeZone'
>;
export function OverviewTab({
  bgColor,
  charging,
  percent,
  weather,
  textColor,
  time,
  timeZone,
}: Props) {
  const { i18n } = useTranslation();
  const number = (value: number | string | null) =>
    value === null || value === ''
      ? '??'
      : new Intl.NumberFormat(i18n.language).format(Number(value));
  return (
    <>
      <div className={styles.batteryContainer} id="battery">
        <div
          className={styles.batteryBar}
          id="battery-bar"
          style={{ backgroundColor: textColor, color: bgColor }}
        >
          <h1 className={[typography['text'], styles.batteryText].join(' ')}>
            {charging && <Zap size={16} />}
            <span>{number(percent)}%</span>
          </h1>
        </div>
      </div>
      {weather && (
        <h1 className={[typography['text'], styles.weatherPosition].join(' ')}>
          <div className={styles.weather}>
            <WeatherIcon status={weather.status} size={16} color={textColor} />
            <span>{number(weather.temp)}º</span>
          </div>
        </h1>
      )}
      <div className={styles.date} id="date">
        <h1 className={[typography['text'], styles.time].join(' ')}>{time}</h1>
        <h2 className={[typography['text'], styles.dateText].join(' ')}>
          {formatDateShort(i18n.language, undefined, timeZone)}
        </h2>
      </div>
    </>
  );
}

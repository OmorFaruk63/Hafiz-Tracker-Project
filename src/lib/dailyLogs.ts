export type DailyLogLike = {
  id?: number;
  date: string;
  loggedAt?: string | null;
};

const toTimestamp = (log: DailyLogLike) => {
  const rawValue = log.loggedAt ?? `${log.date}T00:00:00.000Z`;
  const timestamp = new Date(rawValue).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const sortDailyLogsChronologically = <T extends DailyLogLike>(logs: T[]) =>
  [...logs].sort((left, right) => {
    const timeDelta = toTimestamp(left) - toTimestamp(right);
    if (timeDelta !== 0) return timeDelta;

    const dateDelta = left.date.localeCompare(right.date);
    if (dateDelta !== 0) return dateDelta;

    if (typeof left.id === 'number' && typeof right.id === 'number' && left.id !== right.id) {
      return left.id - right.id;
    }

    return 0;
  });

export const getLatestLogForDate = <T extends DailyLogLike>(logs: T[], date: string) => {
  const matches = sortDailyLogsChronologically(logs.filter((log) => log.date === date));
  return matches[matches.length - 1];
};
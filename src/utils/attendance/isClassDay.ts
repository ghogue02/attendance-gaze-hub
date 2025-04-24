
import { isFriday, eachDayOfInterval, parseISO } from 'date-fns';

const HOLIDAYS = new Set([
  '2025-04-20', // Easter Sunday
  // add more yyyy-mm-dd strings here
]);

export const isClassDay = (isoDate: string): boolean => {
  const d = parseISO(isoDate);           // cheap – no time-zone weirdness
  return !isFriday(d) && !HOLIDAYS.has(isoDate);
};

/**
 * Build once and cache the full list of scheduled class dates between two
 * boundaries – handy for both UI filters and stats exports.
 */
export const getScheduledClassDates = (fromISO: string, toISO: string): string[] =>
  eachDayOfInterval({ start: parseISO(fromISO), end: parseISO(toISO) })
    .filter(d => isClassDay(d.toISOString().slice(0,10)))
    .map(d => d.toISOString().slice(0,10));

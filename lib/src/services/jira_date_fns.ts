import { intervalToDuration } from "date-fns";
import { ReadonlyDate } from "readonly-types";

/**
 * Formats a duration in a manner somewhat reminiscent of Jira.
 *
 * @param duration duration to be formatted
 * @returns  duration in a Jira-like format.
 */
export const jiraFormattedDuration = (duration: Duration): string => {
  const formatPart = (value: number | undefined, unit: string): string =>
    (value ?? 0) > 0 ? `${value ?? 0}${unit} ` : "";

  const years = duration.years ?? 0;
  const months = duration.months ?? 0;

  return years > 0
    ? `${formatPart(duration.years, "y")}${formatPart(
        duration.months,
        "m"
      )}${formatPart(duration.days, "d")}`.trim()
    : months > 0
    ? `${formatPart(duration.months, "m")}${formatPart(
        duration.days,
        "d"
      )}${formatPart(duration.hours, "h")}`.trim()
    : `${formatPart(duration.days, "d")}${formatPart(
        duration.hours,
        "h"
      )}${formatPart(duration.minutes, "m")}`.trim();
};

/**
 * Formats a raw number of seconds in a manner like Jira. In particular,
 * the rollup of hours to days is different, it treats 7h as 1d.
 *
 * @param seconds seconds to be formatted as a Jira like duration.
 * @returns duration in a Jira-like format.
 */
export const jiraFormattedSeconds = (seconds: number): string => {
  const units = (seconds: number, unit: number): readonly [number, number] => {
    const units = Math.floor(seconds / unit);
    const remainder = seconds - units * unit;
    return [units, remainder];
  };

  const ONE_MINUTE_IN_SECONDS = 60;
  const ONE_HOUR_IN_SECONDS = ONE_MINUTE_IN_SECONDS * 60;
  const ONE_JIRA_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 7; // A jira day is 7 hours (make this configurable)

  const [days, secondsAfterDays] = units(seconds, ONE_JIRA_DAY_IN_SECONDS);
  const [hours, secondsAfterHours] = units(
    secondsAfterDays,
    ONE_HOUR_IN_SECONDS
  );
  const [minutes, secondsAfterMinutes] = units(
    secondsAfterHours,
    ONE_MINUTE_IN_SECONDS
  );

  const duration = {
    days,
    hours,
    minutes,
    secondsAfterMinutes,
  };

  return jiraFormattedDuration(duration);
};

/**
 * Formats the difference between two dates (an interval) in a way somewhat like Jira.
 *
 * @param from date at the start of the interval.
 * @param to date at the end of the interval.
 * @returns duration in a Jira-like format.
 */
export const jiraFormattedDistance = (
  from: ReadonlyDate,
  to: ReadonlyDate
): string => {
  const duration = intervalToDuration({
    start: from.getTime(),
    end: to.getTime(),
  });
  return jiraFormattedDuration(duration);
};

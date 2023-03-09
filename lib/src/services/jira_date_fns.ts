/* eslint-next-line functional/prefer-immutable-types: ["error", { "enforcement": "ReadonlyDeep" }] */
import {
  differenceInBusinessDays,
  differenceInMinutes,
  intervalToDuration,
  isBefore,
  max,
  min,
  setHours,
  setMinutes,
} from "date-fns";
import { ReadonlyDate } from "readonly-types";

/**
 * Formats a duration in a manner somewhat reminiscent of Jira.
 *
 * @param duration duration to be formatted
 * @returns  duration in a Jira-like format.
 */
export const jiraFormattedDuration = (duration: Readonly<Duration>): string => {
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
  // eslint-disable-next-line functional/prefer-immutable-types
  const units = (n: number, unit: number): readonly [number, number] => {
    const numberOfUnits = Math.floor(n / unit);
    const remainder = n - numberOfUnits * unit;
    return [numberOfUnits, remainder];
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
  } as const;

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
  // eslint-disable-next-line functional/prefer-immutable-types
  from: ReadonlyDate,
  // eslint-disable-next-line functional/prefer-immutable-types
  to: ReadonlyDate
): string => {
  const duration: Readonly<Duration> = intervalToDuration({
    start: from.getTime(),
    end: to.getTime(),
  });
  return jiraFormattedDuration(duration);
};

/**
 * Calculates the number of business hours (assumed 9-5, Mon-Fri) between two dates.
 *
 * @param to the 'end' date of the interval to measure.
 * @param from the 'start' date of the interval to measure.
 * @returns the number of business hours in the interval.
 */
export const differenceInBusinessHours = (
  // eslint-disable-next-line functional/prefer-immutable-types
  to: ReadonlyDate,
  // eslint-disable-next-line functional/prefer-immutable-types
  from: ReadonlyDate
) => {
  const businessDays = differenceInBusinessDays(to.getTime(), from.getTime());

  return isBefore(to.getTime(), from.getTime())
    ? 0
    : (businessDays === 0
        ? Math.max(
            0,
            differenceInMinutes(
              min([to.getTime(), setMinutes(setHours(to.getTime(), 17), 0)]),
              max([from.getTime(), setMinutes(setHours(from.getTime(), 9), 0)])
            )
          )
        : Math.max(
            0,
            differenceInMinutes(
              setMinutes(setHours(from.getTime(), 17), 0),
              max([from.getTime(), setMinutes(setHours(from.getTime(), 9), 0)])
            )
          ) +
          Math.max(
            0,
            differenceInMinutes(
              min([to.getTime(), setMinutes(setHours(to.getTime(), 17), 0)]),
              setMinutes(setHours(to.getTime(), 9), 0)
            )
          ) +
          (businessDays - 1) * 8 * 60) / 60;
};

/* eslint-disable spellcheck/spell-checker */

import { readonlyDate } from "readonly-types";
import { differenceInBusinessHours } from "./jira_date_fns";

describe("calculating business hours", () => {
  const veryEarlyMonday = readonlyDate("2021-08-16T02:00:00.000+1000");
  const earlyMonday = readonlyDate("2021-08-16T06:00:00.000+1000");
  const monday = readonlyDate("2021-08-16T14:00:00.000+1000");
  const laterOnMonday = readonlyDate("2021-08-16T16:30:00.000+1000");
  const lateMonday = readonlyDate("2021-08-16T23:30:00.000+1000");
  const veryLateMonday = readonlyDate("2021-08-16T23:45:00.000+1000");

  const earlyTuesday = readonlyDate("2021-08-17T06:30:00.000+1000");
  const tuesday = readonlyDate("2021-08-17T12:30:00.000+1000");

  const thursday = readonlyDate("2021-08-19T12:30:00.000+1000");

  it.each([
    ["when the 'to' is before the 'from'", tuesday, monday, 0],
    ["when all time is before 9am", veryEarlyMonday, earlyMonday, 0],
    ["when all time is after 5pm", lateMonday, veryLateMonday, 0],
    ["within the same day", monday, laterOnMonday, 2.5],
    ["when ignoring time before 9am", earlyMonday, monday, 5],
    ["when ignoring time after 5pm", earlyMonday, lateMonday, 8],
    [
      "when ignoring time after 5pm and before 9am",
      lateMonday,
      earlyTuesday,
      0,
    ],
    ["across two days apart", lateMonday, tuesday, 3.5],
    ["across next day", monday, tuesday, 6.5],
    ["across four days", monday, thursday, 22.5],
  ])("works as expected %s", (_description, from, to, expected) => {
    // Given two dates

    // When the number of business hours are calculated
    const actual = differenceInBusinessHours(to, from);

    // Then the expected should match the actual.
    expect(actual).toEqual(expected);
  });
});

/* eslint-disable spellcheck/spell-checker */
/* eslint-disable functional/functional-parameters */
import { EnhancedIssue as EnhancedIssue } from "./jira";
import { match, __, when, not } from "ts-pattern";
import { ReadonlyDate } from "readonly-types";

import {
  subBusinessDays,
  isBefore,
  formatDistance,
  differenceInBusinessDays,
  differenceInCalendarMonths,
  isAfter,
} from "date-fns";
import { ReadonlyNonEmptyArray } from "fp-ts/lib/ReadonlyNonEmptyArray";

// TODO unclear why ReadonlyNonEmptyArray is not judged to be Immutable
// eslint-disable-next-line functional/type-declaration-immutability
export type CheckResult = {
  readonly description: string;
  readonly outcome: "cant apply" | "not applied" | "ok" | "warn" | "fail";
  readonly reasons: ReadonlyNonEmptyArray<string>;
};

export type Check = (issue: EnhancedIssue) => CheckResult;

export type Action = "none" | "inspect";

// eslint-disable-next-line functional/type-declaration-immutability
export type IssueAction = {
  readonly actionRequired: Action;
  readonly checks: readonly CheckResult[];
};

export type Checker = {
  readonly fail: (check: string) => CheckResult;
  readonly ok: (check: string) => CheckResult;
  readonly na: (check: string) => CheckResult;
  readonly cantApply: (check: string) => CheckResult;
};

export const checker = (check: string): Checker => ({
  // eslint-disable-next-line functional/prefer-immutable-types
  fail: (reason: string) => ({
    outcome: "fail",
    description: check,
    reasons: [reason],
  }),
  // eslint-disable-next-line functional/prefer-immutable-types
  ok: (reason: string) => ({
    outcome: "ok",
    description: check,
    reasons: [reason],
  }),
  // eslint-disable-next-line functional/prefer-immutable-types
  na: (reason: string) => ({
    outcome: "not applied",
    description: check,
    reasons: [reason],
  }),
  // eslint-disable-next-line functional/prefer-immutable-types
  cantApply: (reason: string) => ({
    outcome: "cant apply",
    description: check,
    reasons: [reason],
  }),
});

const lastBusinessDay = (at: ReadonlyDate): ReadonlyDate =>
  subBusinessDays(at.valueOf(), 1);

const notInProgressReason = "not in progress";

/**
 * Checks whether an in-progress ticket has been worked (as evidenced by work logs)
 *
 * Applies to: tickets that have an in-progress status category.
 * Fails if: no worklogs in the last business day.
 *
 * @param at the current time
 * @param issue the issue too check.
 * @returns result of checking the issue.
 */
export const validateInProgressHasWorklog =
  (at: ReadonlyDate) =>
  (issue: EnhancedIssue): CheckResult => {
    const check = checker("In progress tickets have been worked");

    const mostRecentWork = issue.mostRecentWorklog?.started;

    const workedRecently =
      mostRecentWork === undefined
        ? false
        : isBefore(lastBusinessDay(at).valueOf(), mostRecentWork.valueOf());

    return match<readonly [boolean, boolean, boolean]>([
      issue.fields.issuetype.name.toLowerCase() === "dependency",
      workedRecently,
      issue.inProgress,
    ])
      .with([true, __, __], () => check.na("Dependencies do not need worklogs"))
      .with([__, false, true], () => check.fail("no recent worklog"))
      .with([__, true, true], () => check.ok("has recent worklog"))
      .otherwise(() => check.na(notInProgressReason));
  };

/**
 * Checks that all dependency issues have a due date.
 * @param issue the issue to check.
 * @returns result of checking the issue.
 */
export const validateDependenciesHaveDueDate = (
  issue: EnhancedIssue
): CheckResult => {
  const check = checker("Dependencies have a due date");

  return match<readonly [boolean, boolean]>([
    issue.fields.issuetype.name.toLowerCase() === "dependency",
    issue.fields.duedate !== undefined,
  ])
    .with([false, __], () => check.na("not a dependency"))
    .with([true, false], () => check.fail("has no due date"))
    .otherwise(() => check.ok("has a due date"));
};

/**
 * Checks that dependency issues that haven't been closed aren't past their due date.
 * @param at the date to take as now.
 * @param issue the issue to check.
 * @returns result of checking the issue.
 */
export const validateNotClosedDependenciesNotPassedDueDate =
  (at: ReadonlyDate) =>
  (issue: EnhancedIssue): CheckResult => {
    const check = checker("Dependencies not passed due date");

    const closed = issue.closed;

    return match<readonly [boolean, boolean, ReadonlyDate | undefined]>([
      issue.fields.issuetype.name.toLowerCase() === "dependency",
      closed,
      issue.fields.duedate,
    ])
      .with([false, __, __], () => check.na("not a dependency"))
      .with([true, true, __], () => check.na("dependency is closed"))
      .with([true, __, undefined], () => check.na("dependency has no due date"))
      .with(
        [
          true,
          __,
          when(
            (duedate) =>
              duedate !== undefined && isAfter(at.valueOf(), duedate.valueOf())
          ),
        ],
        () => check.fail("due date has passed")
      )
      .otherwise(() => check.ok("due date has not passed"));
  };

export const validateInProgressHasEstimate = (
  issue: EnhancedIssue
): CheckResult => {
  const check = checker("In Progress issues have estimates");
  const originalEstimateSeconds =
    issue.fields.aggregatetimeoriginalestimate ?? 0;

  return match<readonly [boolean, boolean, number]>([
    issue.fields.issuetype.name.toLowerCase() === "dependency",
    issue.inProgress,
    originalEstimateSeconds,
  ])
    .with([true, __, __], () =>
      check.na("Dependencies do not require estimates")
    )
    .with([__, false, __], () => check.na(notInProgressReason))
    .with([__, true, when((estimate) => estimate > 0)], () =>
      check.ok("has an estimate")
    )
    .otherwise(() => check.fail("has no estimate"));
};

// TODO check whether the description is a template and fail if it is.
export const validateDescription = (issue: EnhancedIssue): CheckResult => {
  const check = checker("Tickets have a description");

  return issue.description !== undefined && issue.description.trim().length > 0
    ? check.ok("description isn't empty")
    : check.fail("description is empty");
};

const validateNotStalledFor =
  (at: ReadonlyDate) =>
  (
    issue: EnhancedIssue,
    duration: number,
    durationDescription: string
  ): CheckResult => {
    const check = checker("issues not stalled for too long");

    return match<readonly [boolean, ReadonlyDate | undefined]>([
      issue.stalled,
      issue.mostRecentTransition?.created,
    ])
      .with([false, __], () => check.na("not stalled"))
      .with([true, undefined], () =>
        check.cantApply("can not determine transition date")
      )
      .with(
        [true, not(undefined)],
        // eslint-disable-next-line functional/prefer-immutable-types
        ([, transition]) =>
          differenceInBusinessDays(at.valueOf(), transition.valueOf()) >
          duration,
        () => check.fail(`stalled for more than ${durationDescription}`)
      )
      .otherwise(() =>
        check.ok(`stalled for less than ${durationDescription}`)
      );
  };

const validateNotStalledForMoreThanOneDay =
  (at: ReadonlyDate) =>
  (issue: EnhancedIssue): CheckResult =>
    validateNotStalledFor(at)(issue, 0, "one day");

const validateNotStalledForMoreThanOneWeek =
  (at: ReadonlyDate) =>
  (issue: EnhancedIssue): CheckResult =>
    validateNotStalledFor(at)(issue, 5, "one week");

const validateInProgressNotCloseToEstimate = (
  issue: EnhancedIssue
): CheckResult => {
  const check = checker(
    "time spent within acceptable ratio of original estimate"
  );
  const originalEstimateSeconds =
    issue.fields.aggregatetimeoriginalestimate ?? 0;
  const timeSpentSeconds = issue.fields.aggregatetimespent ?? 0;

  return match<readonly [boolean, number]>([issue.inProgress, timeSpentSeconds])
    .with([false, __], () => check.na(notInProgressReason))
    .with([__, when((spent) => spent > originalEstimateSeconds * 0.8)], () =>
      check.fail("time spent > 0.8 of original while in progress")
    )
    .otherwise(() =>
      check.ok("time spent <= 0.8 of original while in progress")
    );
};

/**
 * Checks that issues haven't been languishing in the backlog for too long.
 */
export const validateTooLongInBacklog =
  (at: ReadonlyDate) =>
  (issue: EnhancedIssue): CheckResult => {
    const check = checker("issues don't stay in the backlog for too long");
    const ageInMonths = differenceInCalendarMonths(
      at.valueOf(),
      issue.fields.created.valueOf()
    );

    return match<readonly [string | undefined, number]>([
      issue.column?.toLocaleLowerCase(),
      ageInMonths,
    ])
      .with([not("backlog"), __], () => check.na("not on the backlog"))
      .with(
        ["backlog", __],
        // eslint-disable-next-line functional/prefer-immutable-types
        ([, age]) => age > 3,
        () => check.fail(`in backlog for too long [${ageInMonths} months]`)
      )
      .otherwise(() => check.ok("not too long in backlog"));
  };

// TODO check sub-tasks for comments?
export const validateComment =
  (at: ReadonlyDate) =>
  (issue: EnhancedIssue): CheckResult => {
    const check = checker("issues that have been worked have comments");

    const timeOfMostRecentComment = issue.mostRecentComment?.created.valueOf();
    const loggedTime = issue.fields.aggregatetimespent ?? 0;

    // FIXME this needs to use the aggregated times
    // FIXME check issue age

    return match<readonly [number | undefined, boolean, boolean, number]>([
      timeOfMostRecentComment,
      issue.inProgress,
      issue.closed,
      loggedTime,
    ])
      .with([undefined, false, __, 0], () =>
        check.na("not in progress and no time logged")
      )
      .with([__, __, true, __], () => check.na("closed"))
      .with([undefined, true, false, __], () =>
        check.fail("no comments, in progress")
      )
      .with([undefined, __, false, __], () =>
        check.fail("no comments, time logged")
      )
      .with(
        [not(undefined), __, false, __],
        // eslint-disable-next-line functional/prefer-immutable-types
        ([recentCommentTime, inProgress, , loggedTime]) =>
          isBefore(recentCommentTime, lastBusinessDay(at).valueOf()) &&
          (inProgress || loggedTime > 0),
        // eslint-disable-next-line functional/prefer-immutable-types
        ([recentCommentTime]) => {
          const commentAge = formatDistance(recentCommentTime, at.valueOf());
          return check.fail(
            `last comment was ${commentAge} since last business day, which is longer than allowed`
          );
        }
      )
      .otherwise(() => check.ok("has recent comments"));
  };

const check = (
  issue: EnhancedIssue,
  checks: readonly ((t: EnhancedIssue) => CheckResult)[]
): IssueAction => {
  const noAction: IssueAction = {
    actionRequired: "none",
    checks: [],
  };

  // eslint-disable-next-line functional/prefer-immutable-types
  return checks.reduceRight((issueAction, check) => {
    const result = check(issue);

    const actionRequired: Action = match<readonly [CheckResult], Action>([
      result,
    ])
      .with([{ outcome: "warn" }], () => "inspect")
      .with([{ outcome: "fail" }], () => "inspect")
      .otherwise(() => issueAction.actionRequired);

    return {
      actionRequired,
      checks: issueAction.checks.concat(result),
    };
  }, noAction);
};

/**
 * Determines whether an issue is newly created and should still be in the grace period.
 *
 * @param issue the issue to check.
 * @param now date to take as now.
 * @returns true if the issue deserves some grace, otherwise false.
 */
export const issueDeservesGrace = (
  issue: EnhancedIssue,
  now: ReadonlyDate
): boolean => {
  const age = differenceInBusinessDays(
    issue.fields.created.valueOf(),
    now.valueOf()
  );
  const timeSpent = issue.fields.aggregatetimespent ?? 0;

  return !issue.inProgress && timeSpent === 0 && age < 2;
};

/**
 * Checks whether the issue requires action.
 *
 * @param issue issue to be checked.
 * @param now date to take as now (used for checks such as how long it has been since a comment was made).
 * @returns whether action is required, and the checks that were run to form that recommendation.
 */
export const issueActionRequired = (
  issue: EnhancedIssue,
  now: ReadonlyDate,
  customChecks: readonly Check[]
): IssueAction => {
  return issueDeservesGrace(issue, now)
    ? {
        actionRequired: "none",
        checks: [],
      }
    : check(issue, [
        validateComment(now),
        validateDescription,
        validateInProgressHasEstimate,
        validateInProgressNotCloseToEstimate,
        validateNotStalledForMoreThanOneDay(now),
        validateNotStalledForMoreThanOneWeek(now),
        validateTooLongInBacklog(now),
        validateDependenciesHaveDueDate,
        validateNotClosedDependenciesNotPassedDueDate(now),
        validateInProgressHasWorklog(now),
        ...customChecks,
      ]);
};

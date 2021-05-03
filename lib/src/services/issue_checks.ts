/* eslint-disable functional/functional-parameters */
import { EnhancedIssue as EnhancedIssue } from "./jira";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import { match, __, when, not } from "ts-pattern";
import { ReadonlyDate } from "readonly-types";

import {
  subBusinessDays,
  isBefore,
  formatDistanceToNow,
  differenceInBusinessDays,
} from "date-fns";

export type CheckResult = {
  readonly description: string;
  readonly outcome: "cant apply" | "not applied" | "ok" | "warn" | "fail";
  readonly reasons: NonEmptyArray<string>;
};

export type Action = "none" | "inspect";

export type IssueAction = {
  readonly actionRequired: Action;
  readonly checks: ReadonlyArray<CheckResult>;
};

const fail = (check: string, reason: string): CheckResult => ({
  outcome: "fail",
  description: check,
  reasons: [reason],
});

const ok = (check: string, reason: string): CheckResult => ({
  outcome: "ok",
  description: check,
  reasons: [reason],
});

const na = (check: string, reason: string): CheckResult => ({
  outcome: "not applied",
  description: check,
  reasons: [reason],
});

const cantApply = (check: string, reason: string): CheckResult => ({
  outcome: "cant apply",
  description: check,
  reasons: [reason],
});

export const validateInProgressHasEstimate = (
  issue: EnhancedIssue
): CheckResult => {
  const check = "In Progress issues have estimates";
  const originalEstimateSeconds =
    issue.fields.aggregatetimeoriginalestimate ?? 0;

  return match<readonly [boolean, number]>([
    issue.inProgress,
    originalEstimateSeconds,
  ])
    .with([false, __], () => na(check, "not in progress"))
    .with([true, when((estimate) => estimate > 0)], () =>
      ok(check, "has an estimate")
    )
    .otherwise(() => fail(check, "has no estimate"));
};

// TODO check whether the description is a template and fail if it is.
export const validateDescription = (issue: EnhancedIssue): CheckResult => {
  const check = "Tickets have a description";

  return issue.fields.description !== undefined &&
    issue.fields.description.trim().length > 0
    ? ok(check, "description isn't empty")
    : fail(check, "description is empty");
};

const validateNotStalledForTooLong = (at: ReadonlyDate) => (
  issue: EnhancedIssue
): CheckResult => {
  const check = "issues not stalled for too long";

  return match<readonly [boolean, ReadonlyDate | undefined]>([
    issue.stalled,
    issue.mostRecentTransition?.created,
  ])
    .with([false, __], () => na(check, "not stalled"))
    .with([true, undefined], () =>
      cantApply(check, "can not determine transition date")
    )
    .with(
      [true, not(undefined)],
      ([_b, transition]) =>
        differenceInBusinessDays(at.getDate(), transition.getDate()) > 0,
      () => fail(check, "stalled for more than 1 day")
    )
    .otherwise(() => ok(check, "stalled for less than on day"));
};

const validateInProgressNotCloseToEstimate = (
  issue: EnhancedIssue
): CheckResult => {
  const check = "time spent within acceptable ratio of original estimate";
  const originalEstimateSeconds =
    issue.fields.aggregatetimeoriginalestimate ?? 0;
  const timeSpentSeconds = issue.fields.aggregatetimespent ?? 0;

  return match<readonly [boolean, number]>([issue.inProgress, timeSpentSeconds])
    .with([false, __], () => na(check, "not in progress"))
    .with([__, when((spent) => spent > originalEstimateSeconds * 0.8)], () =>
      fail(check, "time spent > 0.8 of original while in progress")
    )
    .otherwise(() =>
      ok(check, "time spent <= 0.8 of original while in progress")
    );
};

// TODO check sub-tasks for comments?
const validateComment = (at: ReadonlyDate) => (
  issue: EnhancedIssue
): CheckResult => {
  const check = "issues that have been worked have comments";

  const lastBusinessDay = subBusinessDays(at.getDate(), 1);

  const timeOfMostRecentComment = issue.mostRecentComment?.created.getTime();
  const loggedTime = issue.fields.aggregatetimespent ?? 0;

  // FIXME this needs to use the aggregated times
  // FIXME check issue age

  return match<readonly [number | undefined, boolean, number]>([
    timeOfMostRecentComment,
    issue.inProgress,
    loggedTime,
  ])
    .with([undefined, false, 0], () =>
      na(check, "not in progress and no time logged")
    )
    .with([undefined, __, __], () => fail(check, "no comments, time logged"))
    .with([undefined, true, __], () => fail(check, "no comments, in progress"))
    .with(
      [not(undefined), true, __],
      ([recentCommentTime]) =>
        isBefore(recentCommentTime, lastBusinessDay.getTime()),
      ([recentCommentTime]) => {
        const commentAge = formatDistanceToNow(recentCommentTime);
        return fail(
          check,
          `last comment was ${commentAge} since last business day, which is longer than allowed`
        );
      }
    )
    .otherwise(() => ok(check, "has recent comments"));
};

const check = (
  issue: EnhancedIssue,
  checks: ReadonlyArray<(t: EnhancedIssue) => CheckResult>
): IssueAction => {
  const noAction: IssueAction = {
    actionRequired: "none",
    checks: [],
  };

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
  const age = differenceInBusinessDays(issue.fields.created, now.getDate());
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
  now: ReadonlyDate
): IssueAction => {
  return issueDeservesGrace(issue, now)
    ? {
        actionRequired: "none",
        checks: [],
      }
    : check(issue, [
        validateComment(now),
        validateInProgressHasEstimate,
        validateInProgressNotCloseToEstimate,
        validateNotStalledForTooLong(now),
        validateDescription,
      ]);
};

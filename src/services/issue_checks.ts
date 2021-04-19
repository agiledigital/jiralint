/* eslint-disable functional/functional-parameters */
import { EnhancedTicket } from "./jira";
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

export type TicketAction = {
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

const validateInProgressHasEstimate = (ticket: EnhancedTicket): CheckResult => {
  const check = "In Progress tickets have estimates";
  const originalEstimateSeconds =
    ticket.fields.aggregatetimeoriginalestimate ?? 0;

  return match<readonly [boolean, number]>([
    ticket.inProgress,
    originalEstimateSeconds,
  ])
    .with([false, __], () => na(check, "not in progress"))
    .with([true, when((estimate) => estimate > 0)], () =>
      ok(check, "as an estimate")
    )
    .otherwise(() => fail(check, "has no estimate"));
};

const validateNotStalledForTooLong = (at: ReadonlyDate) => (
  ticket: EnhancedTicket
): CheckResult => {
  const check = "tickets not stalled for too long";

  return match<readonly [boolean, ReadonlyDate | undefined]>([
    ticket.stalled,
    ticket.mostRecentTransition?.created,
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
  ticket: EnhancedTicket
): CheckResult => {
  const check = "time spent within acceptable ratio of original estimate";
  const originalEstimateSeconds =
    ticket.fields.aggregatetimeoriginalestimate ?? 0;
  const timeSpentSeconds = ticket.fields.aggregatetimespent ?? 0;

  return match<readonly [boolean, number]>([
    ticket.inProgress,
    timeSpentSeconds,
  ])
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
  ticket: EnhancedTicket
): CheckResult => {
  const check = "tickets that have been worked have comments";

  const lastBusinessDay = subBusinessDays(at.getDate(), 1);

  const timeOfMostRecentComment = ticket.mostRecentComment?.created.getTime();
  const loggedTime = ticket.fields.aggregatetimespent ?? 0;

  // FIXME this needs to use the aggregated times
  // FIXME check ticket age

  return match<readonly [number | undefined, boolean, number]>([
    timeOfMostRecentComment,
    ticket.inProgress,
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
  ticket: EnhancedTicket,
  checks: ReadonlyArray<(t: EnhancedTicket) => CheckResult>
): TicketAction => {
  const noAction: TicketAction = {
    actionRequired: "none",
    checks: [],
  };

  return checks.reduceRight((ticketAction, check) => {
    const result = check(ticket);

    const actionRequired: Action = match<readonly [CheckResult], Action>([
      result,
    ])
      .with([{ outcome: "warn" }], () => "inspect")
      .with([{ outcome: "fail" }], () => "inspect")
      .otherwise(() => ticketAction.actionRequired);

    return {
      actionRequired,
      checks: ticketAction.checks.concat(result),
    };
  }, noAction);
};

export const ticketActionRequired = (
  ticket: EnhancedTicket,
  now: ReadonlyDate
): TicketAction => {
  return check(ticket, [
    validateComment(now),
    validateInProgressHasEstimate,
    validateInProgressNotCloseToEstimate,
    validateNotStalledForTooLong(now),
  ]);
};

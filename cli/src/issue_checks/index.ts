// Custom issue checks that do not belong in the base lib package.

/* eslint-disable functional/functional-parameters */

import type {
  CheckResult,
  EnhancedIssue,
} from "@agiledigital-labs/jiralint-lib";
import { checker } from "@agiledigital-labs/jiralint-lib";
import { match, not } from "ts-pattern";

/**
 * Checks that issues have a QA impact statement if they are review (close to being tested)
 * or completed (ready to be tested).
 *
 * Applies to: tickets that are under review or ready for testing.
 *
 * @param issue the issue to check.
 * @returns result of checking the issue.
 */
export const validateHasQaImpactStatement =
  (qaImpactStatementField: string) =>
  (issue: EnhancedIssue): CheckResult => {
    const check = checker("Issues have a QA impact statement");

    const qaImpactStatement = issue.fields[qaImpactStatementField];

    return match<readonly [string | undefined, string]>([
      issue.column?.toLocaleLowerCase(),
      (typeof qaImpactStatement === "string" ? qaImpactStatement : "").trim(),
    ])
      .with(["review", ""], ["completed", ""], () =>
        check.fail("missing a QA impact statement")
      )
      .with(["review", not("")], ["completed", not("")], () =>
        check.ok("has a QA impact statement")
      )
      .otherwise(() =>
        check.na("does not apply unless in Review or Completed")
      );
  };

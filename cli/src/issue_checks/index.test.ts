/* eslint-disable jest/expect-expect */
/* eslint-disable functional/no-return-void */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-restricted-globals */
/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable-next-line functional/no-return-void */
import fc from "fast-check";
import { CheckResult, EnhancedIssue } from "@agiledigital-labs/jiralint-lib";
import { validateHasQaImpactStatement } from ".";
import * as IssueData from "./test_data/issue_data";

describe("checking QA impact statements", () => {
  const qaImpactStatementField = "test-qa-impact-statement-field";

  const input = (
    column: string,
    statement: string | undefined
  ): EnhancedIssue => ({
    ...IssueData.enhancedIssue,
    fields: {
      ...IssueData.enhancedIssue.fields,
      [qaImpactStatementField]: statement,
    },
    column,
  });

  const check =
    (expected: Partial<CheckResult>) =>
    (column: string, statement: string | undefined) => {
      const actual = validateHasQaImpactStatement(qaImpactStatementField)(
        input(column, statement)
      );
      expect(actual).toEqual(expect.objectContaining(expected));
    };

  const inReviewOrCompleted = fc.oneof(
    fc.constant("review"),
    fc.constant("completed"),
    fc.constant("Review"),
    fc.constant("Completed")
  );

  it("should always pass issues in review or completed that have a non-empty statement", () => {
    fc.assert(
      fc.property(
        inReviewOrCompleted,
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        check({
          outcome: "ok",
          reasons: ["has a QA impact statement"],
        })
      )
    );
  });
  it("should always fail issues in review or completed that have an empty statement", () => {
    fc.assert(
      fc.property(
        inReviewOrCompleted,
        fc.oneof(fc.constant(undefined), fc.constant(""), fc.constant("   ")),
        check({
          outcome: "fail",
          reasons: ["missing a QA impact statement"],
        })
      )
    );
  });
  it("should not apply to issues that are not in review or completed", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== "review" && s !== "completed"),
        fc.string(),
        check({
          outcome: "not applied",
          reasons: ["does not apply unless in Review or Completed"],
        })
      )
    );
  });
});

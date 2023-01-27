import { IssueAction } from "./issue_checks";

/**
 * Derives the overall 'quality' of an issue by totalling the number of warnings
 * and failures.
 *
 * @param issueAction the actionable info about the issue.
 * @returns the overall quality.
 */
export const quality = (issueAction: IssueAction): string => {
  const numberOfFailures = issueAction.checks.filter(
    (check) => check.outcome === "fail"
  ).length;
  const numberOfWarnings = issueAction.checks.filter(
    (check) => check.outcome === "warn"
  ).length;

  const total = numberOfFailures * 2 + numberOfWarnings;

  return total === 0
    ? "A+"
    : total === 1
    ? "A"
    : total < 3
    ? "B"
    : total < 5
    ? "C"
    : "F";
};

/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statement */
import * as I from "./issue_checks";
import { EnhancedIssue, Issue } from "./jira";

const issue: Issue = {
  key: "ABC-123",
  self: "self",
  fields: {
    summary: "summary",
    project: {
      key: "project",
    },
    timetracking: {},
    fixVersions: [],
    aggregateprogress: {
      progress: undefined,
      total: undefined,
      percent: undefined,
    },
    issuetype: {
      name: "issue name",
    },
    assignee: {
      name: "assignee",
    },
    status: {
      id: "id",
      name: "status",
      statusCategory: {
        id: undefined,
        name: undefined,
        colorName: undefined,
      },
    },
    comment: {
      comments: [],
    },
  },
  changelog: {
    histories: [],
  },
};

const enhancedIssue: EnhancedIssue = {
  ...issue,
  inProgress: true,
  stalled: false,
  released: false,
  viewLink: "viewlink",
};

describe("checking in progress tickets have estimates", () => {
  test("fails if an inprogress issue has no estimate", () => {
    const issueWithNoEstimateButInProgress = {
      ...enhancedIssue,
      inProgress: true,
      fields: {
        ...enhancedIssue.fields,
        aggregatetimeoriginalestimate: 0,
      },
    };

    const actual = I.validateInProgressHasEstimate(
      issueWithNoEstimateButInProgress
    );

    expect(actual.outcome).toStrictEqual("fail");
    expect(actual.reasons).toStrictEqual(["has no estimate"]);
  });

  test("passes if an inprogress issue has an estimate", () => {
    const issueWithNoEstimateButInProgress = {
      ...enhancedIssue,
      inProgress: true,
      fields: {
        ...enhancedIssue.fields,
        aggregatetimeoriginalestimate: 10,
      },
    };

    const actual = I.validateInProgressHasEstimate(
      issueWithNoEstimateButInProgress
    );

    expect(actual.outcome).toStrictEqual("ok");
    expect(actual.reasons).toStrictEqual(["has an estimate"]);
  });

  test("isn't applied if the ticket isn't in progress", () => {
    const issueWithNoEstimateButInProgress = {
      ...enhancedIssue,
      inProgress: false,
      fields: {
        ...enhancedIssue.fields,
        aggregatetimeoriginalestimate: 0,
      },
    };

    const actual = I.validateInProgressHasEstimate(
      issueWithNoEstimateButInProgress
    );

    expect(actual.outcome).toStrictEqual("not applied");
    expect(actual.reasons).toStrictEqual(["not in progress"]);
  });
});

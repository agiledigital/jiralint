/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statement */
import {
  validateInProgressHasEstimate,
  validateDescription,
} from "./issue_checks";
import { EnhancedIssue, Issue } from "./jira";

const issue: Issue = {
  key: "ABC-123",
  self: "self",
  fields: {
    summary: "summary",
    description: "description",
    // eslint-disable-next-line no-restricted-globals
    created: new Date("2020-01-01"),
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
      subtask: false,
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
      maxResults: 0,
      total: 0,
      startAt: 0,
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

describe("checking that in progress tickets have estimates", () => {
  it.each([
    [true, 0, { outcome: "fail", reasons: ["has no estimate"] }],
    [true, 10, { outcome: "ok", reasons: ["has an estimate"] }],
    [false, 0, { outcome: "not applied", reasons: ["not in progress"] }],
    [false, 10, { outcome: "not applied", reasons: ["not in progress"] }],
  ])("checks as expected", (inProgress, estimate, expected) => {
    const input = {
      ...enhancedIssue,
      inProgress,
      fields: {
        ...enhancedIssue.fields,
        aggregatetimeoriginalestimate: estimate,
      },
    };

    const actual = validateInProgressHasEstimate(input);

    expect(actual).toEqual(expect.objectContaining(expected));
  });
});

describe("checking that tickets have a description", () => {
  it.each([
    ["", { outcome: "fail", reasons: ["description is empty"] }],
    [undefined, { outcome: "fail", reasons: ["description is empty"] }],
    ["description", { outcome: "ok", reasons: ["description isn't empty"] }],
  ])("checks as expected", (description, expected) => {
    const input = {
      ...enhancedIssue,
      fields: {
        ...enhancedIssue.fields,
        description,
      },
    };

    const actual = validateDescription(input);

    expect(actual).toEqual(expect.objectContaining(expected));
  });
});

/* eslint-disable jest/expect-expect */
/* eslint-disable functional/no-return-void */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-restricted-globals */
/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable-next-line functional/no-return-void */
import {
  validateInProgressHasEstimate,
  validateDescription,
  validateComment,
  validateTooLongInBacklog,
  validateDependenciesHaveDueDate,
  validateNotClosedDependenciesNotPassedDueDate,
  validateHasQaImpactStatement,
  CheckResult,
} from "./issue_checks";
import { EnhancedIssue, Issue, QaImpactStatementField } from "./jira";
import fc from "fast-check";

const issue: Issue = {
  key: "ABC-123",
  self: "self",
  fields: {
    summary: "summary",
    description: "description",
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
    duedate: undefined,
  },
  changelog: {
    histories: [],
  },
};

const enhancedIssue: EnhancedIssue = {
  ...issue,
  inProgress: true,
  stalled: false,
  closed: false,
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

describe("checking comments", () => {
  it.each([
    [
      "a recent comment",
      new Date("2020/12/1"),
      true,
      false,
      0,
      new Date("2020/12/1"),
      { outcome: "ok", reasons: ["has recent comments"] },
    ],
    [
      "an old comment, in progress",
      new Date("2019/10/1"),
      true,
      false,
      0,
      new Date("2020/12/1"),
      {
        outcome: "fail",
        reasons: [
          "last comment was about 1 year since last business day, which is longer than allowed",
        ],
      },
    ],
    [
      "an old comment, time logged",
      new Date("2019/10/1"),
      false,
      false,
      10000000,
      new Date("2020/12/1"),
      {
        outcome: "fail",
        reasons: [
          "last comment was about 1 year since last business day, which is longer than allowed",
        ],
      },
    ],
    [
      "an old comment, time logged, closed",
      new Date("2019/10/1"),
      false,
      true,
      10000000,
      new Date("2020/12/1"),
      {
        outcome: "not applied",
        reasons: ["closed"],
      },
    ],
    [
      undefined,
      new Date("2020/10/1"),
      true,
      false,
      0,
      new Date("2020/12/1"),
      { outcome: "fail", reasons: ["no comments, in progress"] },
    ],
  ])(
    "checks as expected",
    (
      commentText,
      date,
      inProgress,
      closed,
      aggregatetimespent,
      now,
      expected
    ) => {
      const mostRecentComment =
        commentText !== undefined
          ? {
              id: "id",
              author: {
                name: "some guy",
              },
              body: commentText,
              created: date,
              updated: date,
            }
          : undefined;

      const input = {
        ...enhancedIssue,
        fields: {
          ...enhancedIssue.fields,
          aggregatetimespent,
        },
        mostRecentComment,
        inProgress,
        closed,
      };

      const actual = validateComment(now)(input);

      expect(actual).toEqual(expect.objectContaining(expected));
    }
  );
});

describe("checking for tickets languishing in the backlog", () => {
  it.each([
    [
      new Date("2020/11/1"),
      "backlog",
      new Date("2020/12/1"),
      { outcome: "ok", reasons: ["not too long in backlog"] },
    ],
    [
      new Date("2019/06/1"),
      "backlog",
      new Date("2020/12/1"),
      {
        outcome: "fail",
        reasons: ["in backlog for too long [18 months]"],
      },
    ],
    [
      new Date("2019/10/1"),
      "not backlog",
      new Date("2020/12/1"),
      {
        outcome: "not applied",
        reasons: ["not on the backlog"],
      },
    ],
  ])("checks as expected", (created, column, now, expected) => {
    const input = {
      ...enhancedIssue,
      fields: {
        ...enhancedIssue.fields,
        created,
      },
      column,
    };

    const actual = validateTooLongInBacklog(now)(input);

    expect(actual).toEqual(expect.objectContaining(expected));
  });
});

describe("checking that dependencies have a due date", () => {
  it.each([
    [
      "not a dependency",
      undefined,
      { outcome: "not applied", reasons: ["not a dependency"] },
    ],
    [
      "not a dependnecy",
      new Date("2019/06/1"),
      { outcome: "not applied", reasons: ["not a dependency"] },
    ],
    [
      "dependency",
      undefined,
      { outcome: "fail", reasons: ["has no due date"] },
    ],
    [
      "dependency",
      new Date("2019/06/1"),
      { outcome: "ok", reasons: ["has a due date"] },
    ],
  ])("checks as expected", (issueTypeName, duedate, expected) => {
    const input = {
      ...enhancedIssue,
      fields: {
        ...enhancedIssue.fields,
        issuetype: {
          ...enhancedIssue.fields.issuetype,
          name: issueTypeName,
        },
        duedate,
      },
    };

    const actual = validateDependenciesHaveDueDate(input);

    expect(actual).toEqual(expect.objectContaining(expected));
  });
});

describe("checking that dependencies have not blown past the due date", () => {
  it.each([
    [
      "not a dependency",
      undefined,
      new Date("2018/06/1"),
      false,
      { outcome: "not applied", reasons: ["not a dependency"] },
    ],
    [
      "not a dependency",
      new Date("2019/06/1"),
      new Date("2018/06/1"),
      false,
      { outcome: "not applied", reasons: ["not a dependency"] },
    ],
    [
      "dependency",
      undefined,
      new Date("2018/06/1"),
      false,
      { outcome: "not applied", reasons: ["dependency has no due date"] },
    ],
    [
      "dependency",
      new Date("2019/06/1"),
      new Date("2018/06/1"),
      false,
      { outcome: "fail", reasons: ["due date has passed"] },
    ],
    [
      "dependency",
      new Date("2019/06/1"),
      new Date("2018/06/1"),
      true,
      { outcome: "not applied", reasons: ["dependency is closed"] },
    ],
    [
      "dependency",
      new Date("2017/06/1"),
      new Date("2018/06/1"),
      false,
      { outcome: "ok", reasons: ["due date has not passed"] },
    ],
    [
      "dependency",
      new Date("2017/06/1"),
      new Date("2018/06/1"),
      true,
      { outcome: "not applied", reasons: ["dependency is closed"] },
    ],
  ])("checks as expected", (issueTypeName, duedate, now, closed, expected) => {
    const input = {
      ...enhancedIssue,
      fields: {
        ...enhancedIssue.fields,
        issuetype: {
          ...enhancedIssue.fields.issuetype,
          name: issueTypeName,
        },
        duedate,
      },
      closed,
    };

    const actual = validateNotClosedDependenciesNotPassedDueDate(now)(input);

    expect(actual).toEqual(expect.objectContaining(expected));
  });
});

describe("checking QA impact statements", () => {
  const input = (
    column: string,
    statement: string | undefined
  ): EnhancedIssue => ({
    ...enhancedIssue,
    fields: {
      ...enhancedIssue.fields,
      [QaImpactStatementField]: statement,
    },
    column,
  });

  const check = (expected: Partial<CheckResult>) => (
    column: string,
    statement: string | undefined
  ) => {
    const actual = validateHasQaImpactStatement(input(column, statement));
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

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
} from "./issue_checks";
import * as IssueData from "./test_data/issue_data";

describe("checking that in progress tickets have estimates", () => {
  it.each([
    [true, 0, { outcome: "fail", reasons: ["has no estimate"] }],
    [true, 10, { outcome: "ok", reasons: ["has an estimate"] }],
    [false, 0, { outcome: "not applied", reasons: ["not in progress"] }],
    [false, 10, { outcome: "not applied", reasons: ["not in progress"] }],
  ])("checks as expected", (inProgress, estimate, expected) => {
    const input = {
      ...IssueData.enhancedIssue,
      inProgress,
      fields: {
        ...IssueData.enhancedIssue.fields,
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
      ...IssueData.enhancedIssue,
      fields: {
        ...IssueData.enhancedIssue.fields,
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
        ...IssueData.enhancedIssue,
        fields: {
          ...IssueData.enhancedIssue.fields,
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
      ...IssueData.enhancedIssue,
      fields: {
        ...IssueData.enhancedIssue.fields,
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
      ...IssueData.enhancedIssue,
      fields: {
        ...IssueData.enhancedIssue.fields,
        issuetype: {
          ...IssueData.enhancedIssue.fields.issuetype,
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
      ...IssueData.enhancedIssue,
      fields: {
        ...IssueData.enhancedIssue.fields,
        issuetype: {
          ...IssueData.enhancedIssue.fields.issuetype,
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

/* eslint functional/prefer-immutable-types: ["error", { "enforcement": "ReadonlyDeep" }] */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable functional/no-return-void */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statements */

import {
  validateInProgressHasEstimate,
  validateInProgressHasWorklog,
  validateDescription,
  validateComment,
  validateTooLongInBacklog,
  validateDependenciesHaveDueDate,
  validateNotClosedDependenciesNotPassedDueDate,
} from "./issue_checks";
import * as IssueData from "./test_data/issue_data";
import { readonlyDate } from "readonly-types";

describe("checking that in progress tickets have worklogs", () => {
  const tuesday = readonlyDate("2021-08-17T12:50:00.000+1000");
  const monday = readonlyDate("2021-08-16T14:00:00.000Z");
  const sunday = readonlyDate("2021-08-15T14:00:00.000Z");

  it.each([
    [
      true,
      undefined,
      tuesday,
      { outcome: "fail", reasons: ["no recent worklog"] },
    ],
    [
      true,
      sunday,
      tuesday,
      { outcome: "fail", reasons: ["no recent worklog"] },
    ],
    [true, monday, tuesday, { outcome: "ok", reasons: ["has recent worklog"] }],
    [
      false,
      undefined,
      tuesday,
      { outcome: "not applied", reasons: ["not in progress"] },
    ],
    [
      false,
      monday,
      tuesday,
      { outcome: "not applied", reasons: ["not in progress"] },
    ],
  ] as const)(
    "checks as expected %#",
    (inProgress, lastWorklogCreated, checkTime, expected) => {
      // eslint-disable-next-line functional/prefer-immutable-types
      const mostRecentWorklog =
        lastWorklogCreated === undefined
          ? undefined
          : {
              ...IssueData.worklog,
              started: lastWorklogCreated,
            };

      // eslint-disable-next-line functional/prefer-immutable-types
      const input = {
        ...IssueData.enhancedIssue,
        inProgress,
        mostRecentWorklog,
      };

      const actual = validateInProgressHasWorklog(checkTime)(input);

      expect(actual).toEqual(expect.objectContaining(expected));
    }
  );
});

describe("checking that in progress tickets have estimates", () => {
  it.each([
    [true, 0, { outcome: "fail", reasons: ["has no estimate"] }],
    [true, 10, { outcome: "ok", reasons: ["has an estimate"] }],
    [false, 0, { outcome: "not applied", reasons: ["not in progress"] }],
    [false, 10, { outcome: "not applied", reasons: ["not in progress"] }],
  ] as const)("checks as expected", (inProgress, estimate, expected) => {
    // eslint-disable-next-line functional/prefer-immutable-types
    const input = {
      ...IssueData.enhancedIssue,
      inProgress,
      fields: {
        ...IssueData.enhancedIssue.fields,
        aggregatetimeoriginalestimate: estimate,
      },
    } as const;

    const actual = validateInProgressHasEstimate(input);

    expect(actual).toEqual(expect.objectContaining(expected));
  });
});

describe("checking that tickets have a description", () => {
  it.each([
    ["", { outcome: "fail", reasons: ["description is empty"] }],
    [undefined, { outcome: "fail", reasons: ["description is empty"] }],
    ["description", { outcome: "ok", reasons: ["description isn't empty"] }],
  ] as const)("checks as expected", (description, expected) => {
    // eslint-disable-next-line functional/prefer-immutable-types
    const input = {
      ...IssueData.enhancedIssue,
      description,
    };

    const actual = validateDescription(input);

    expect(actual).toEqual(expect.objectContaining(expected));
  });
});

describe("checking comments", () => {
  it.each([
    [
      "a recent comment",
      readonlyDate("2020/12/1"),
      true,
      false,
      0,
      readonlyDate("2020/12/1"),
      { outcome: "ok", reasons: ["has recent comments"] },
    ],
    [
      "an old comment, in progress",
      readonlyDate("2019/10/1"),
      true,
      false,
      0,
      readonlyDate("2020/12/1"),
      {
        outcome: "fail",
        reasons: [
          "last comment was about 1 year since last business day, which is longer than allowed",
        ],
      },
    ],
    [
      "an old comment, time logged",
      readonlyDate("2019/10/1"),
      false,
      false,
      10000000,
      readonlyDate("2020/12/1"),
      {
        outcome: "fail",
        reasons: [
          "last comment was about 1 year since last business day, which is longer than allowed",
        ],
      },
    ],
    [
      "an old comment, time logged, closed",
      readonlyDate("2019/10/1"),
      false,
      true,
      10000000,
      readonlyDate("2020/12/1"),
      {
        outcome: "not applied",
        reasons: ["closed"],
      },
    ],
    [
      undefined,
      readonlyDate("2020/10/1"),
      true,
      false,
      0,
      readonlyDate("2020/12/1"),
      { outcome: "fail", reasons: ["no comments, in progress"] },
    ],
  ] as const)(
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
      // eslint-disable-next-line functional/prefer-immutable-types
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

      // eslint-disable-next-line functional/prefer-immutable-types
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
      readonlyDate("2020/11/1"),
      "backlog",
      readonlyDate("2020/12/1"),
      { outcome: "ok", reasons: ["not too long in backlog"] },
    ],
    [
      readonlyDate("2019/06/1"),
      "backlog",
      readonlyDate("2020/12/1"),
      {
        outcome: "fail",
        reasons: ["in backlog for too long [18 months]"],
      },
    ],
    [
      readonlyDate("2019/10/1"),
      "not backlog",
      readonlyDate("2020/12/1"),
      {
        outcome: "not applied",
        reasons: ["not on the backlog"],
      },
    ],
  ] as const)("checks as expected", (created, column, now, expected) => {
    // eslint-disable-next-line functional/prefer-immutable-types
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
      "not a dependency",
      readonlyDate("2019/06/1"),
      { outcome: "not applied", reasons: ["not a dependency"] },
    ],
    [
      "dependency",
      undefined,
      { outcome: "fail", reasons: ["has no due date"] },
    ],
    [
      "dependency",
      readonlyDate("2019/06/1"),
      { outcome: "ok", reasons: ["has a due date"] },
    ],
  ] as const)("checks as expected", (issueTypeName, duedate, expected) => {
    // eslint-disable-next-line functional/prefer-immutable-types
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
      readonlyDate("2018/06/1"),
      false,
      { outcome: "not applied", reasons: ["not a dependency"] },
    ],
    [
      "not a dependency",
      readonlyDate("2019/06/1"),
      readonlyDate("2018/06/1"),
      false,
      { outcome: "not applied", reasons: ["not a dependency"] },
    ],
    [
      "dependency",
      undefined,
      readonlyDate("2018/06/1"),
      false,
      { outcome: "not applied", reasons: ["dependency has no due date"] },
    ],
    [
      "dependency",
      readonlyDate("2018/06/1"),
      readonlyDate("2019/06/1"),
      false,
      { outcome: "fail", reasons: ["due date has passed"] },
    ],
    [
      "dependency",
      readonlyDate("2018/06/1"),
      readonlyDate("2019/06/1"),
      true,
      { outcome: "not applied", reasons: ["dependency is closed"] },
    ],
    [
      "dependency",
      readonlyDate("2018/06/1"),
      readonlyDate("2017/06/1"),
      false,
      { outcome: "ok", reasons: ["due date has not passed"] },
    ],
    [
      "dependency",
      readonlyDate("2018/06/1"),
      readonlyDate("2017/06/1"),
      true,
      { outcome: "not applied", reasons: ["dependency is closed"] },
    ],
  ] as const)(
    "checks as expected",
    (issueTypeName, duedate, now, closed, expected) => {
      // eslint-disable-next-line functional/prefer-immutable-types
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
    }
  );
});

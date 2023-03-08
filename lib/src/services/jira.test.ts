/* eslint-disable functional/no-return-void */
// TODO Promote this to at least ReadonlyDeep
/* eslint functional/prefer-immutable-types: ["error", { "enforcement": "ReadonlyShallow" }] */

/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statements */
/* eslint-disable functional/no-throw-statements */
/* eslint-disable functional/no-conditional-statements */
/* eslint-disable jest/no-conditional-expect */
import {
  Issue,
  mostRecentIssueComment,
  mostRecentIssueTransition,
  IssueChangeLog,
  issueTransitions,
  issueLastWorked,
  IssueWorklog,
  enhancedIssue,
} from "./jira";
import { PathReporter } from "io-ts/PathReporter";
import * as E from "fp-ts/lib/Either";
import { isLeft } from "fp-ts/lib/These";

import * as TestData from "./test_data/jira_data";
import * as IssueData from "./test_data/issue_data";
import { readonlyDate } from "readonly-types/dist";
import fc from "fast-check";

const commentFrom2021 = {
  id: "5",
  author: IssueData.issue.fields.assignee,
  body: "new comment",
  created: readonlyDate("2021-04-03"),
  updated: readonlyDate("2000-04-03"),
} as const;

const commentFrom2000 = {
  id: "1",
  author: IssueData.issue.fields.assignee,
  body: "old comment",
  created: readonlyDate("2000-02-03"),
  updated: readonlyDate("2030-04-03"),
} as const;

const descriptionChangeItem = {
  field: "description",
  fieldtype: "string",
  from: null,
  fromString: "",
  to: "description",
  toString: "description",
} as const;

const statusChangeItem = {
  field: "status",
  fieldtype: "jira",
  from: "1",
  fromString: "Ready for Estimation",
  to: "2",
  toString: "In Progress",
} as const;

const descriptionHistoryFrom2021: Readonly<IssueChangeLog> = {
  id: "1",
  author: IssueData.issue.fields.assignee,
  created: readonlyDate("2021-06-03"),
  items: [descriptionChangeItem],
};

const statusChangeFrom2000: Readonly<IssueChangeLog> = {
  id: "2",
  author: IssueData.issue.fields.assignee,
  created: readonlyDate("2000-03-03"),
  items: [statusChangeItem],
};

const mixedChangeFrom2022: Readonly<IssueChangeLog> = {
  id: "4",
  author: IssueData.issue.fields.assignee,
  created: readonlyDate("2022-03-03"),
  items: [statusChangeItem, descriptionChangeItem],
};

const worklogFrom2019: Readonly<IssueWorklog> = {
  author: IssueData.issue.fields.assignee,
  started: readonlyDate("2019-03-03"),
  timeSpentSeconds: 1000,
  comment: "no comment",
};

describe("decoding well-formed tickets", () => {
  it.each([
    [TestData.regular, TestData.regular.key],
    [TestData.nullDescription, TestData.nullDescription.key],
    [TestData.withParent, TestData.withParent.key],
  ])("decodes as expected", (data, expectedKey) => {
    // Given a well-formed bit of data.

    // When it is decoded.
    const actual = Issue.decode(data);

    // Then no errors should be reported.
    const actualErrors = E.isLeft(actual)
      ? JSON.stringify(PathReporter.report(actual), null, 2)
      : undefined;
    expect(actualErrors).toBeUndefined();

    // And the decoded key should match the expected one.
    if (isLeft(actual)) {
      throw new Error(
        `[${JSON.stringify(actual, null, 2)}] is unexpectedly left.`
      );
    } else {
      expect(actual.right.key).toEqual(expectedKey);
    }
  });
});

describe("finding the most recent work date", () => {
  // eslint-disable-next-line functional/prefer-immutable-types
  const issueWithTransition = {
    ...IssueData.issue,
    changelog: {
      histories: [mixedChangeFrom2022],
    },
  };

  // eslint-disable-next-line functional/prefer-immutable-types
  const issueWithComment = {
    ...IssueData.issue,
    fields: {
      ...IssueData.issue.fields,
      comment: {
        comments: [commentFrom2000],
        maxResults: 0,
        total: 0,
        startAt: 0,
      },
    },
  };

  // eslint-disable-next-line functional/prefer-immutable-types
  const issueWithWorklog = {
    ...IssueData.issue,
    fields: {
      ...IssueData.issue.fields,
      worklog: {
        worklogs: [worklogFrom2019],
        maxResults: 0,
        total: 0,
        startAt: 0,
      },
    },
  };

  // eslint-disable-next-line functional/prefer-immutable-types
  const issueWithEverything = {
    ...IssueData.issue,
    fields: {
      ...IssueData.issue.fields,
      worklog: {
        worklogs: [worklogFrom2019],
        maxResults: 0,
        total: 0,
        startAt: 0,
      },
      comment: {
        comments: [commentFrom2000],
        maxResults: 0,
        total: 0,
        startAt: 0,
      },
    },
    changelog: {
      histories: [mixedChangeFrom2022],
    },
  };

  it.each([
    ["not worked", IssueData.issue, undefined],
    ["with a transition", issueWithTransition, mixedChangeFrom2022.created],
    ["with a comment", issueWithComment, commentFrom2000.created],
    ["with a worklog", issueWithWorklog, worklogFrom2019.started],
    ["with all three", issueWithEverything, mixedChangeFrom2022.created],
  ] as const)(
    "should returned for expected result for an issue %s",
    // eslint-disable-next-line functional/prefer-immutable-types
    (_desc, issue, expected) => {
      // Given an issue.

      // When the time it was last worked is found.
      // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
      const lastWorked = issueLastWorked(issue);

      // Then it should match the expected value.
      expect(lastWorked).toEqual(expected);
    }
  );
});

describe("finding the most recent comment", () => {
  it.each([
    [[], undefined],
    [[commentFrom2000], commentFrom2000],
    [[commentFrom2000, commentFrom2021], commentFrom2021],
    [[commentFrom2000, commentFrom2021, commentFrom2000], commentFrom2021],
  ] as const)("should be found as expected", (comments, expected) => {
    // Given an issue with the provided comments
    // eslint-disable-next-line functional/prefer-immutable-types
    const issue = {
      ...IssueData.issue,
      fields: {
        ...IssueData.issue.fields,
        comment: {
          comments,
          maxResults: 0,
          total: 0,
          startAt: 0,
        },
      },
    };

    // When the most recent comment is found.
    // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
    const actual = mostRecentIssueComment(issue);

    // Then it should be expected value.
    expect(actual).toEqual(expected);
  });
});

describe("finding transitions", () => {
  it.each([
    ["an empty array", [], []],
    ["a description change only", [descriptionHistoryFrom2021], []],
    ["one status change", [statusChangeFrom2000], [statusChangeFrom2000]],
    [
      "multiple status changes",
      [statusChangeFrom2000, mixedChangeFrom2022],
      [statusChangeFrom2000, mixedChangeFrom2022],
    ],
    [
      "a mix of status and other changes",
      [statusChangeFrom2000, mixedChangeFrom2022, descriptionHistoryFrom2021],
      [statusChangeFrom2000, mixedChangeFrom2022],
    ],
  ] as const)("should filter %s as expected", (_desc, histories, expected) => {
    // Given some change histories.
    // eslint-disable-next-line functional/prefer-immutable-types
    const issue = {
      ...IssueData.issue,
      changelog: {
        histories: histories,
      },
    };

    // When the transitions are identified.
    // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
    const actual = issueTransitions(issue);

    // Then they should match the expected value.
    expect(actual).toEqual(expected);
  });
});

describe("finding the most recent transition", () => {
  // eslint-disable-next-line functional/prefer-immutable-types
  const statusChangeFrom2021: IssueChangeLog = {
    id: "3",
    author: IssueData.issue.fields.assignee,
    created: readonlyDate("2021-03-03"),
    items: [statusChangeItem],
  };

  // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
  it.each([
    [[], undefined],
    [[descriptionHistoryFrom2021], undefined],
    [[statusChangeFrom2000], statusChangeFrom2000],
    [[statusChangeFrom2000, statusChangeFrom2021], statusChangeFrom2021],
    [
      [statusChangeFrom2000, statusChangeFrom2021, mixedChangeFrom2022],
      mixedChangeFrom2022,
    ],
    [[statusChangeFrom2000, descriptionHistoryFrom2021], statusChangeFrom2000],
    [
      [statusChangeFrom2000, mixedChangeFrom2022, statusChangeFrom2000],
      mixedChangeFrom2022,
    ],
    // eslint-disable-next-line functional/prefer-immutable-types
  ] as const)("should be found as expected", (histories, expected) => {
    // Given an issue with the provided changelogs
    // eslint-disable-next-line functional/prefer-immutable-types
    const issue = {
      ...IssueData.issue,
      changelog: {
        histories: histories,
      },
    };

    // When the most recent comment is found.
    // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
    const actual = mostRecentIssueTransition(issue);

    // Then it should be expected value.
    expect(actual).toEqual(expected);
  });
});

describe("enhancing issues", () => {
  it("should extract the issue quality if set", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (fieldName, value) => {
          // Given an issue that has the provided value
          // eslint-disable-next-line functional/prefer-immutable-types
          const issue = {
            ...IssueData.issue,
            fields: {
              ...IssueData.issue.fields,
              [fieldName]: value,
            },
          };

          // When it is enhanced
          const enhanced = enhancedIssue(
            issue,
            "viewlink",
            fieldName,
            "not_reason"
          );

          // Then the quality field should have been set.
          expect(enhanced.quality).toBe(value);
        }
      )
    );
  });
  it("should extract the issue quality reason if set", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (fieldName, value) => {
          // Given an issue that has the provided value
          // eslint-disable-next-line functional/prefer-immutable-types
          const issue = {
            ...IssueData.issue,
            fields: {
              ...IssueData.issue.fields,
              [fieldName]: value,
            },
          };

          // When it is enhanced
          const enhanced = enhancedIssue(
            issue,
            "viewlink",
            "not_quality",
            fieldName
          );

          // Then the quality field should have been set.
          expect(enhanced.qualityReason).toBe(value);
        }
      )
    );
  });
});

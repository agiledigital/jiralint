/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
/* eslint-disable spellcheck/spell-checker */
import * as T from "io-ts";
import * as ITT from "io-ts-types";
import { compareDesc } from "date-fns";
import { ReadonlyDate } from "readonly-types/dist";
import {
  dateToDate,
  nullOrMissingToUndefined,
  readOnlyDateFromISOString,
} from "../codecs";

export const PaginatedResults = T.readonly(
  T.type({
    maxResults: T.number,
    total: T.number,
    startAt: T.number,
  })
);

export const Author = T.type({
  name: nullOrMissingToUndefined(T.string),
});

export const IssueComment = T.type({
  id: T.string,
  author: nullOrMissingToUndefined(Author),
  body: T.string,
  created: readOnlyDateFromISOString,
  updated: readOnlyDateFromISOString,
});

export const IssueCommentGeneric = T.type({
  id: T.string,
  author: nullOrMissingToUndefined(Author),
  body: T.string,
  created: dateToDate,
  updated: dateToDate,
});

export const ChangeLog = T.type({
  id: T.string,
  author: Author,
  created: readOnlyDateFromISOString,
  items: T.readonlyArray(
    T.type({
      field: T.string,
      fieldtype: T.string,
      from: T.union([T.string, T.null]),
      fromString: T.union([T.string, T.null]),
      to: T.union([T.string, T.null]),
      toString: T.union([T.string, T.null]),
    })
  ),
});

export const ChangeLogGeneric = T.type({
  id: T.string,
  author: Author,
  created: dateToDate,
  items: T.readonlyArray(
    T.type({
      field: T.string,
      fieldtype: T.string,
      from: T.union([T.string, T.null]),
      fromString: T.union([T.string, T.null]),
      to: T.union([T.string, T.null]),
      toString: T.union([T.string, T.null]),
    })
  ),
});

export const IssueWorklog = T.type({
  author: Author,
  started: readOnlyDateFromISOString,
  timeSpentSeconds: T.number,
  comment: nullOrMissingToUndefined(T.string),
});

export const IssueWorklogGeneric = T.type({
  author: Author,
  started: dateToDate,
  timeSpentSeconds: T.number,
  comment: nullOrMissingToUndefined(T.string),
});

export const OnPremJiraIssue = T.type({
  key: T.string,
  self: T.string,
  fields: T.intersection([
    T.type({
      summary: T.string,
      description: nullOrMissingToUndefined(T.string),
      created: readOnlyDateFromISOString,
      project: T.type({
        key: T.string,
      }),
      timetracking: ITT.fromNullable(
        T.partial({
          originalEstimateSeconds: T.number,
          timeSpentSeconds: T.number,
          remainingEstimateSeconds: T.number,
          originalEstimate: T.string,
          timeSpent: T.string,
        }),
        {
          originalEstimateSeconds: 0,
          timeSpentSeconds: 0,
          remainingEstimateSeconds: 0,
          originalEstimate: "0d",
          timeSpent: "0d",
        }
      ),
      fixVersions: T.readonlyArray(
        T.type({
          id: T.string,
          name: T.string,
          released: T.boolean,
        })
      ),
      aggregateprogress: T.type({
        progress: nullOrMissingToUndefined(T.number),
        total: nullOrMissingToUndefined(T.number),
        percent: nullOrMissingToUndefined(T.number),
      }),
      issuetype: T.type({
        name: T.string,
        subtask: T.boolean,
      }),
      assignee: T.type({
        name: T.string,
      }),
      status: T.type({
        id: T.string,
        name: T.string,
        statusCategory: T.type({
          id: nullOrMissingToUndefined(T.number),
          name: nullOrMissingToUndefined(T.string),
          colorName: nullOrMissingToUndefined(T.string),
        }),
      }),
      comment: nullOrMissingToUndefined(
        T.readonly(
          T.intersection([
            PaginatedResults,
            T.type({
              comments: T.readonlyArray(IssueComment),
            }),
          ])
        )
      ),
      worklog: nullOrMissingToUndefined(
        T.readonly(
          T.intersection([
            PaginatedResults,
            T.type({
              worklogs: T.readonlyArray(IssueWorklog),
            }),
          ])
        )
      ),
      duedate: nullOrMissingToUndefined(ITT.DateFromISOString),
    }),
    T.partial({
      aggregatetimeestimate: nullOrMissingToUndefined(T.number),
      aggregatetimeoriginalestimate: nullOrMissingToUndefined(T.number),
      aggregatetimespent: nullOrMissingToUndefined(T.number),
      parent: T.type({
        id: T.string,
        key: T.string,
      }),
    }),
    // Required to model custom fields whose names cannot be known at compile time
    T.readonly(T.record(T.string, T.unknown)),
  ]),
  changelog: ITT.fromNullable(
    T.type({
      histories: T.readonlyArray(ChangeLog),
    }),
    {
      histories: [],
    }
  ),
});

export const CloudJiraIssue = T.type({
  key: T.string,
  self: T.string,
  fields: T.intersection([
    T.type({
      summary: T.string,
      description: nullOrMissingToUndefined(T.string),
      created: readOnlyDateFromISOString,
      project: T.type({
        key: T.string,
      }),
      timetracking: ITT.fromNullable(
        T.partial({
          originalEstimateSeconds: T.number,
          timeSpentSeconds: T.number,
          remainingEstimateSeconds: T.number,
          originalEstimate: T.string,
          timeSpent: T.string,
        }),
        {
          originalEstimateSeconds: 0,
          timeSpentSeconds: 0,
          remainingEstimateSeconds: 0,
          originalEstimate: "0d",
          timeSpent: "0d",
        }
      ),
      fixVersions: T.readonlyArray(
        T.type({
          id: T.string,
          name: T.string,
          released: T.boolean,
        })
      ),
      aggregateprogress: T.type({
        progress: nullOrMissingToUndefined(T.number),
        total: nullOrMissingToUndefined(T.number),
        percent: nullOrMissingToUndefined(T.number),
      }),
      issuetype: T.type({
        name: T.string,
        subtask: T.boolean,
      }),
      assignee: T.type({
        accountId: T.string,
        displayName: T.string,
      }),
      status: T.type({
        id: T.string,
        name: T.string,
        statusCategory: T.type({
          id: nullOrMissingToUndefined(T.number),
          name: nullOrMissingToUndefined(T.string),
          colorName: nullOrMissingToUndefined(T.string),
        }),
      }),
      comment: nullOrMissingToUndefined(
        T.readonly(
          T.intersection([
            PaginatedResults,
            T.type({
              comments: T.readonlyArray(IssueComment),
            }),
          ])
        )
      ),
      worklog: nullOrMissingToUndefined(
        T.readonly(
          T.intersection([
            PaginatedResults,
            T.type({
              worklogs: T.readonlyArray(IssueWorklog),
            }),
          ])
        )
      ),
      duedate: nullOrMissingToUndefined(ITT.DateFromISOString),
    }),
    T.partial({
      aggregatetimeestimate: nullOrMissingToUndefined(T.number),
      aggregatetimeoriginalestimate: nullOrMissingToUndefined(T.number),
      aggregatetimespent: nullOrMissingToUndefined(T.number),
      parent: T.type({
        id: T.string,
        key: T.string,
      }),
    }),
    // Required to model custom fields whose names cannot be known at compile time
    T.readonly(T.record(T.string, T.unknown)),
  ]),
  changelog: ITT.fromNullable(
    T.type({
      histories: T.readonlyArray(ChangeLog),
    }),
    {
      histories: [],
    }
  ),
});

/*Type that can represent both On-prem Jira and Cloud Jira */
export const GenericJiraIssue = T.type({
  key: T.string,
  self: T.string,
  fields: T.intersection([
    T.type({
      summary: T.string,
      description: nullOrMissingToUndefined(T.string),
      created: dateToDate,
      project: T.type({
        key: T.string,
      }),
      timetracking: ITT.fromNullable(
        T.partial({
          originalEstimateSeconds: T.number,
          timeSpentSeconds: T.number,
          remainingEstimateSeconds: T.number,
          originalEstimate: T.string,
          timeSpent: T.string,
        }),
        {
          originalEstimateSeconds: 0,
          timeSpentSeconds: 0,
          remainingEstimateSeconds: 0,
          originalEstimate: "0d",
          timeSpent: "0d",
        }
      ),
      fixVersions: T.readonlyArray(
        T.type({
          id: T.string,
          name: T.string,
          released: T.boolean,
        })
      ),
      aggregateprogress: T.type({
        progress: nullOrMissingToUndefined(T.number),
        total: nullOrMissingToUndefined(T.number),
        percent: nullOrMissingToUndefined(T.number),
      }),
      issuetype: T.type({
        name: T.string,
        subtask: T.boolean,
        // hierarchyLevel: T.string,
      }),
      assignee: T.type({
        assigneeName: T.string,
      }),
      status: T.type({
        id: T.string,
        name: T.string,
        statusCategory: T.type({
          id: nullOrMissingToUndefined(T.number),
          name: nullOrMissingToUndefined(T.string),
          colorName: nullOrMissingToUndefined(T.string),
        }),
      }),
      comment: nullOrMissingToUndefined(
        T.readonly(
          T.intersection([
            PaginatedResults,
            T.type({
              comments: T.readonlyArray(IssueCommentGeneric),
            }),
          ])
        )
      ),
      worklog: nullOrMissingToUndefined(
        T.readonly(
          T.intersection([
            PaginatedResults,
            T.type({
              worklogs: T.readonlyArray(IssueWorklogGeneric),
            }),
          ])
        )
      ),
      duedate: nullOrMissingToUndefined(ITT.DateFromISOString),
    }),
    T.partial({
      aggregatetimeestimate: nullOrMissingToUndefined(T.number),
      aggregatetimeoriginalestimate: nullOrMissingToUndefined(T.number),
      aggregatetimespent: nullOrMissingToUndefined(T.number),
      parent: T.type({
        id: T.string,
        key: T.string,
      }),
    }),
    // Required to model custom fields whose names cannot be known at compile time
    T.readonly(T.record(T.string, T.unknown)),
  ]),
  changelog: ITT.fromNullable(
    T.type({
      histories: T.readonlyArray(ChangeLogGeneric),
    }),
    {
      histories: [],
    }
  ),
});

export type OnPremJiraIssue = T.TypeOf<typeof OnPremJiraIssue>;

export type CloudJiraIssue = T.TypeOf<typeof CloudJiraIssue>;

export type GenericJiraIssue = T.TypeOf<typeof GenericJiraIssue>;

export type IssueComment = T.TypeOf<typeof IssueComment>;

export type IssueChangeLog = T.TypeOf<typeof ChangeLog>;

export type IssueWorklog = T.TypeOf<typeof IssueWorklog>;

export const BoardColumn = T.type({
  name: T.string,
  statuses: T.readonlyArray(
    T.type({
      id: T.string,
    })
  ),
});

export type BoardColumn = T.TypeOf<typeof BoardColumn>;

export const Board = T.type({
  id: T.number,
  name: T.string,
  type: T.string,
  columnConfig: T.type({
    columns: T.readonlyArray(BoardColumn),
    constraintType: T.string,
  }),
});

export type Board = T.TypeOf<typeof Board>;

export const BoardSummary = T.type({
  id: T.number,
  name: T.string,
});

export type BoardSummary = T.TypeOf<typeof BoardSummary>;

export type EnhancedIssue = GenericJiraIssue & {
  readonly board?: Board;
  readonly inProgress: boolean;
  readonly stalled: boolean;
  readonly closed: boolean;
  readonly released: boolean;
  readonly column?: string;
  readonly mostRecentComment?: IssueComment;
  readonly mostRecentTransition?: IssueChangeLog;
  readonly mostRecentWorklog?: IssueWorklog;
  readonly viewLink: string;
  readonly lastWorked?: ReadonlyDate; // The last time that there was evidence the ticket was actively worked (e.g. there was a transition, worklog or comment added).
  readonly quality: string | undefined;
  readonly qualityReason: string | undefined; // The reason that the issue has the quality rating it does.
};

export const User = T.type({
  name: T.string,
  emailAddress: T.string,
  displayName: T.string,
});

export type User = T.TypeOf<typeof User>;

/**
 * Error type returned by the Jira API.
 *
 * When updating an issue, `errors` may contain per-field errors.
 */
export const JiraError = T.type({
  name: T.string,
  statusCode: T.number,
  message: T.string,
  error: T.type({
    errors: T.UnknownRecord,
  }),
});

export type JiraError = T.TypeOf<typeof JiraError>;

const columnForIssue = (
  issue: GenericJiraIssue,
  board: Board
): BoardColumn | undefined => {
  return board.columnConfig.columns.find((column) =>
    column.statuses.some((status) => status.id === issue.fields.status.id)
  );
};

const issueInProgress = (issue: GenericJiraIssue, board?: Board): boolean => {
  return board !== undefined
    ? columnForIssue(issue, board)?.name.toLowerCase() === "in progress"
    : issue.fields.status.name.toLowerCase() === "in progress";
};

const issueStalled = (issue: GenericJiraIssue, board?: Board): boolean => {
  return board !== undefined
    ? (columnForIssue(issue, board)?.name ?? "")
        .toLowerCase()
        .startsWith("stalled")
    : issue.fields.status.name.toLowerCase().startsWith("stalled");
};

const issueClosed = (issue: GenericJiraIssue, board?: Board): boolean => {
  return board !== undefined
    ? columnForIssue(issue, board)?.name.toLowerCase() === "release ready"
    : issue.fields.status.statusCategory.name?.toLowerCase() === "done";
};

/**
 * Finds the changelogs where the status of the issue was changed (i.e. there was a transition).
 * @param issue the issue whose transitions should be found.
 * @returns the changelogs where the status changed.
 */
export const issueTransitions = (
  issue: GenericJiraIssue
): readonly IssueChangeLog[] => {
  const changelogs: readonly IssueChangeLog[] = [...issue.changelog.histories];

  return changelogs.filter((changelog) =>
    changelog.items.some(
      (item) => item.field === "status" && item.fieldtype === "jira"
    )
  );
};

/**
 * Finds the most recent transition of the issue.
 * @param issue the issue whose most recent transition should be found.
 * @returns the most recent transition, or undefined if no transitions have occurred.
 */
export const mostRecentIssueTransition = (
  issue: GenericJiraIssue
): IssueChangeLog | undefined => {
  const transitions = issueTransitions(issue);

  return [...transitions].sort((a, b) =>
    compareDesc(a.created.valueOf(), b.created.valueOf())
  )[0];
};

/**
 * Finds the most recent comment of the issue (based on created date).
 * @param issue the issue whose most recent comment should be found.
 * @returns the most recent comment, or undefined if no comments have been made.
 */
export const mostRecentIssueComment = (
  issue: GenericJiraIssue
): IssueComment | undefined => {
  const comments =
    issue.fields.comment === undefined ? [] : issue.fields.comment.comments;

  return [...comments].sort((a, b) =>
    compareDesc(a.created.valueOf(), b.created.valueOf())
  )[0];
};

/**
 * Finds the most recent worklog on the issue (based on the started date).
 * @param issue the issue whose most recent worklog should be found.
 * @returns the most recent worklog, or undefined if no work has been logged.
 */
export const mostRecentIssueWorklog = (
  issue: GenericJiraIssue
): IssueWorklog | undefined => {
  const worklogs =
    issue.fields.worklog === undefined ? [] : issue.fields.worklog.worklogs;

  return [...worklogs].sort((a, b) =>
    compareDesc(a.started.valueOf(), b.started.valueOf())
  )[0];
};

/**
 * Determines the time at which the issue was last worked, as evidenced by
 * comments, transitions or worklogs.
 * @param issue the issue.
 * @returns the time that the issue was last worked, or undefined if it has never been worked.
 */
export const issueLastWorked = (
  issue: GenericJiraIssue
): ReadonlyDate | undefined => {
  const mostRecentTransition = mostRecentIssueTransition(issue);

  const mostRecentComment = mostRecentIssueComment(issue);

  const mostRecentWorklog = mostRecentIssueWorklog(issue);

  return [
    mostRecentTransition?.created,
    mostRecentComment?.created,
    mostRecentWorklog?.started,
  ]
    .filter((d): d is ReadonlyDate => d !== undefined)
    .sort((a, b) => compareDesc(a.valueOf(), b.valueOf()))[0];
};

export const enhancedIssue = (
  issue: GenericJiraIssue,
  viewLink: string,
  qualityFieldName: string,
  qualityReasonFieldName: string,
  board?: Board
): EnhancedIssue => {
  const mostRecentTransition = mostRecentIssueTransition(issue);

  const mostRecentComment = mostRecentIssueComment(issue);

  const released = issue.fields.fixVersions.some((version) => version.released);

  const lastWorked = issueLastWorked(issue);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const quality = issue.fields[qualityFieldName] as string | undefined; // type-coverage:ignore-line

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const qualityReason = issue.fields[qualityReasonFieldName] as  // type-coverage:ignore-line
    | string
    | undefined;

  return {
    ...issue,
    inProgress: issueInProgress(issue, board),
    stalled: issueStalled(issue, board),
    closed: issueClosed(issue, board),
    column:
      board !== undefined ? columnForIssue(issue, board)?.name : undefined,
    mostRecentTransition: mostRecentTransition,
    mostRecentComment: mostRecentComment,
    released: released,
    viewLink,
    lastWorked: lastWorked,
    quality,
    qualityReason,
  };
};

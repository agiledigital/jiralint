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

export const IssueCommentBuilder = (
  dateCodec: // eslint-disable-next-line @typescript-eslint/ban-types, no-restricted-globals
  T.Type<ReadonlyDate, Date> | T.Type<ReadonlyDate, string>
) =>
  T.type({
    id: T.string,
    author: nullOrMissingToUndefined(Author),
    body: T.string,
    created: dateCodec,
    updated: dateCodec,
  });

export const ChangeLogBuilder = (
  dateCodec: // eslint-disable-next-line @typescript-eslint/ban-types, no-restricted-globals
  T.Type<ReadonlyDate, Date> | T.Type<ReadonlyDate, string>
) =>
  T.type({
    id: T.string,
    author: Author,
    created: dateCodec,
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

export const IssueWorklogBuilder = (
  dateCodec: // eslint-disable-next-line @typescript-eslint/ban-types, no-restricted-globals
  T.Type<ReadonlyDate, Date> | T.Type<ReadonlyDate, string>
) =>
  T.type({
    author: Author,
    started: dateCodec,
    timeSpentSeconds: T.number,
    comment: nullOrMissingToUndefined(T.string),
  });

export const JiraIssueBuilder = (
  dateCodec: // eslint-disable-next-line @typescript-eslint/ban-types, no-restricted-globals
  T.Type<ReadonlyDate, Date> | T.Type<ReadonlyDate, string>
) =>
  T.type({
    key: T.string,
    self: T.string,
    fields: T.intersection([
      T.type({
        summary: T.string,
        description: nullOrMissingToUndefined(T.string),
        created: dateCodec,
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
                comments: T.readonlyArray(IssueCommentBuilder(dateCodec)),
              }),
            ])
          )
        ),
        worklog: nullOrMissingToUndefined(
          T.readonly(
            T.intersection([
              PaginatedResults,
              T.type({
                worklogs: T.readonlyArray(IssueWorklogBuilder(dateCodec)),
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
        histories: T.readonlyArray(ChangeLogBuilder(dateCodec)),
      }),
      {
        histories: [],
      }
    ),
  });

export const OnPremJiraIssue = T.intersection([
  JiraIssueBuilder(readOnlyDateFromISOString),
  T.type({
    fields: T.type({
      assignee: T.type({
        name: T.string,
      }),
    }),
  }),
]);

export const CloudJiraIssue = T.intersection([
  JiraIssueBuilder(readOnlyDateFromISOString),
  T.type({
    fields: T.type({
      assignee: T.type({
        accountId: T.string,
        displayName: T.string,
      }),
    }),
  }),
]);
//convertISO ? readOnlyDateFromISOString : dateToDate
export const JiraIssue = T.intersection([
  JiraIssueBuilder(dateToDate),
  T.type({
    fields: T.type({
      assignee: T.type({
        name: T.string,
      }),
    }),
  }),
]);

export type OnPremJiraIssue = T.TypeOf<typeof OnPremJiraIssue>;

export type CloudJiraIssue = T.TypeOf<typeof CloudJiraIssue>;

export type JiraIssue = T.TypeOf<typeof JiraIssue>;

export const IssueComment = IssueCommentBuilder(readOnlyDateFromISOString);

export const ChangeLog = ChangeLogBuilder(readOnlyDateFromISOString);

export const IssueWorklog = IssueWorklogBuilder(readOnlyDateFromISOString);

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

export type EnhancedIssue = JiraIssue & {
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
  issue: JiraIssue,
  board: Board
): BoardColumn | undefined => {
  return board.columnConfig.columns.find((column) =>
    column.statuses.some((status) => status.id === issue.fields.status.id)
  );
};

const issueInProgress = (issue: JiraIssue, board?: Board): boolean => {
  return board !== undefined
    ? columnForIssue(issue, board)?.name.toLowerCase() === "in progress"
    : issue.fields.status.name.toLowerCase() === "in progress";
};

const issueStalled = (issue: JiraIssue, board?: Board): boolean => {
  return board !== undefined
    ? (columnForIssue(issue, board)?.name ?? "")
        .toLowerCase()
        .startsWith("stalled")
    : issue.fields.status.name.toLowerCase().startsWith("stalled");
};

const issueClosed = (issue: JiraIssue, board?: Board): boolean => {
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
  issue: JiraIssue
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
  issue: JiraIssue
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
  issue: JiraIssue
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
  issue: JiraIssue
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
export const issueLastWorked = (issue: JiraIssue): ReadonlyDate | undefined => {
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
  issue: JiraIssue,
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

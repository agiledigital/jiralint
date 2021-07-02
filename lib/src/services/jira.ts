import * as T from "io-ts";
import * as ITT from "io-ts-types";
import { compareDesc } from "date-fns";

/**
 * Converts a codec into one that treats a missing property or null value as undefined.
 * @param t the type of the property - if it is supplied and not null.
 * @returns a codec that will treat missing property or null value as undefined.
 */
const nullOrMissingToUndefined = <P, O = P>(
  t: T.Type<P, O>
  // eslint-disable-next-line functional/prefer-readonly-type
): T.UnionC<[T.Type<P, O, unknown>, T.UndefinedC]> =>
  ITT.fromNullable(T.union([t, T.undefined]), undefined);

export const AccountField = "customfield_11410 "; // FIXME should be configurable.

export const QualityField = "customfield_12410"; // FIXME should be configurable.

export const QaImpactStatementField = "customfield_10111"; // FIXME should be configurable.

export const PaginatedResults = T.readonly(
  T.type({
    maxResults: T.number,
    total: T.number,
    startAt: T.number,
  })
);

export const Author = T.type({
  name: T.string,
});

export const IssueComment = T.type({
  id: T.string,
  author: Author,
  body: T.string,
  created: ITT.DateFromISOString,
  updated: ITT.DateFromISOString,
});

export const ChangeLog = T.type({
  id: T.string,
  author: Author,
  created: ITT.DateFromISOString,
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
  started: ITT.DateFromISOString,
  timeSpentSeconds: T.number,
  comment: nullOrMissingToUndefined(T.string),
});

export const Issue = T.type({
  key: T.string,
  self: T.string,
  fields: T.intersection([
    T.type({
      summary: T.string,
      description: nullOrMissingToUndefined(T.string),
      created: ITT.DateFromISOString,
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
      account: T.type({
        AccountField: T.type({
          key: T.string,
        }),
      }),
      aggregatetimeestimate: nullOrMissingToUndefined(T.number),
      aggregatetimeoriginalestimate: nullOrMissingToUndefined(T.number),
      aggregatetimespent: nullOrMissingToUndefined(T.number),
      [QualityField]: nullOrMissingToUndefined(T.string),
      [QaImpactStatementField]: nullOrMissingToUndefined(T.string),
      parent: T.type({
        id: T.string,
        key: T.string,
      }),
    }),
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

export type Issue = T.TypeOf<typeof Issue>;

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

export type EnhancedIssue = Issue & {
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
  issue: Issue,
  board: Board
): BoardColumn | undefined => {
  return board.columnConfig.columns.find((column) =>
    column.statuses.some((status) => status.id === issue.fields.status.id)
  );
};

const issueInProgress = (issue: Issue, board?: Board): boolean => {
  return board !== undefined
    ? columnForIssue(issue, board)?.name.toLowerCase() === "in progress"
    : issue.fields.status.name.toLowerCase() === "in progress";
};

const issueStalled = (issue: Issue, board?: Board): boolean => {
  return board !== undefined
    ? (columnForIssue(issue, board)?.name ?? "")
        .toLowerCase()
        .startsWith("stalled")
    : issue.fields.status.name.toLowerCase().startsWith("stalled");
};

const issueClosed = (issue: Issue, board?: Board): boolean => {
  return board !== undefined
    ? columnForIssue(issue, board)?.name.toLowerCase() === "release ready"
    : issue.fields.status.statusCategory.name?.toLowerCase() === "done";
};

export const enhancedIssue = (
  issue: Issue,
  viewLink: string,
  board?: Board
): EnhancedIssue => {
  const changelogs: readonly IssueChangeLog[] = [
    ...issue.changelog.histories,
  ].sort((a, b) => compareDesc(a.created, b.created));

  const mostRecentTransition = changelogs.find((changelog) =>
    changelog.items.some(
      (item) => item.field === "status" && item.fieldtype === "jira"
    )
  );

  const released = issue.fields.fixVersions.some((version) => version.released);

  return {
    ...issue,
    inProgress: issueInProgress(issue, board),
    stalled: issueStalled(issue, board),
    closed: issueClosed(issue, board),
    column:
      board !== undefined ? columnForIssue(issue, board)?.name : undefined,
    mostRecentTransition: mostRecentTransition,
    released: released,
    viewLink,
  };
};

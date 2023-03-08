/* eslint functional/prefer-immutable-types: ["error", { "enforcement": "ReadonlyDeep" }] */
/* eslint-disable spellcheck/spell-checker */
import * as T from "io-ts";
import * as ITT from "io-ts-types";
import { compareDesc } from "date-fns";
import { ReadonlyDate, ReadonlyRecord } from "readonly-types/dist";
import { nullOrMissingToUndefined, readonlyDateFromDate } from "../codecs";

export const PaginatedResults = T.readonly(
  T.type({
    maxResults: T.number,
    total: T.number,
    startAt: T.number,
  })
);

export const Author = T.readonly(
  T.type({
    name: nullOrMissingToUndefined(T.readonly(T.string)),
  })
);

export const IssueComment = T.readonly(
  T.type({
    id: T.string,
    author: nullOrMissingToUndefined(Author),
    body: T.string,
    created: readonlyDateFromDate,
    updated: readonlyDateFromDate,
  })
);

export const ChangeLog = T.readonly(
  T.type({
    id: T.string,
    author: Author,
    created: readonlyDateFromDate,
    items: T.readonlyArray(
      T.readonly(
        T.type({
          field: T.string,
          fieldtype: T.string,
          from: T.union([T.string, T.null]),
          fromString: T.union([T.string, T.null]),
          to: T.union([T.string, T.null]),
          toString: T.union([T.string, T.null]),
        })
      )
    ),
  })
);

export const IssueWorklog = T.readonly(
  T.type({
    author: Author,
    started: readonlyDateFromDate,
    timeSpentSeconds: T.number,
    comment: nullOrMissingToUndefined(T.string),
  })
);

export const BaseIssue = T.readonly(
  T.type({
    key: T.string,
    self: T.string,
    fields: T.intersection([
      T.readonly(
        T.type({
          summary: T.string,
          description: nullOrMissingToUndefined(T.string),
          created: readonlyDateFromDate,
          project: T.readonly(
            T.type({
              key: T.string,
            })
          ),
          timetracking: ITT.fromNullable(
            T.readonly(
              T.partial({
                originalEstimateSeconds: T.number,
                timeSpentSeconds: T.number,
                remainingEstimateSeconds: T.number,
                originalEstimate: T.string,
                timeSpent: T.string,
              })
            ),
            {
              originalEstimateSeconds: 0,
              timeSpentSeconds: 0,
              remainingEstimateSeconds: 0,
              originalEstimate: "0d",
              timeSpent: "0d",
            }
          ),
          fixVersions: T.readonlyArray(
            T.readonly(
              T.type({
                id: T.string,
                name: T.string,
                released: T.boolean,
              })
            )
          ),
          aggregateprogress: T.readonly(
            T.type({
              progress: nullOrMissingToUndefined(T.number),
              total: nullOrMissingToUndefined(T.number),
              percent: nullOrMissingToUndefined(T.number),
            })
          ),
          issuetype: T.readonly(
            T.type({
              name: T.string,
              subtask: T.boolean,
            })
          ),
          status: T.readonly(
            T.type({
              id: T.string,
              name: T.string,
              statusCategory: T.readonly(
                T.type({
                  id: nullOrMissingToUndefined(T.number),
                  name: nullOrMissingToUndefined(T.string),
                  colorName: nullOrMissingToUndefined(T.string),
                })
              ),
            })
          ),
          comment: nullOrMissingToUndefined(
            T.readonly(
              T.intersection([
                PaginatedResults,
                T.readonly(
                  T.type({
                    comments: T.readonlyArray(IssueComment),
                  })
                ),
              ])
            )
          ),
          worklog: nullOrMissingToUndefined(
            T.readonly(
              T.intersection([
                PaginatedResults,
                T.readonly(
                  T.type({
                    worklogs: T.readonlyArray(IssueWorklog),
                  })
                ),
              ])
            )
          ),
          duedate: nullOrMissingToUndefined(readonlyDateFromDate),
        })
      ),
      T.readonly(
        T.partial({
          aggregatetimeestimate: nullOrMissingToUndefined(T.number),
          aggregatetimeoriginalestimate: nullOrMissingToUndefined(T.number),
          aggregatetimespent: nullOrMissingToUndefined(T.number),
          parent: T.readonly(
            T.type({
              id: T.string,
              key: T.string,
            })
          ),
        })
      ),
      // Required to model custom fields whose names cannot be known at compile time
      T.readonly(T.record(T.string, T.unknown)),
    ]),
    changelog: ITT.fromNullable(
      T.readonly(
        T.type({
          histories: T.readonlyArray(ChangeLog),
        })
      ),
      {
        histories: [],
      }
    ),
  })
);

export const OnPremIssue = T.readonly(
  T.intersection([
    BaseIssue,
    T.readonly(
      T.type({
        fields: T.readonly(
          T.type({
            assignee: nullOrMissingToUndefined(
              T.readonly(
                T.type({
                  name: T.string,
                })
              )
            ),
          })
        ),
      })
    ),
  ])
);

export const CloudIssue = T.readonly(
  T.intersection([
    BaseIssue,
    T.readonly(
      T.type({
        fields: T.readonly(
          T.type({
            assignee: nullOrMissingToUndefined(
              T.readonly(
                T.type({
                  displayName: T.string,
                })
              )
            ),
          })
        ),
      })
    ),
  ])
);

export const Issue = T.readonly(
  T.intersection([
    BaseIssue,
    T.readonly(
      T.type({
        fields: T.readonly(
          T.type({
            assignee: nullOrMissingToUndefined(
              T.readonly(
                T.type({
                  name: T.string,
                })
              )
            ),
          })
        ),
      })
    ),
  ])
);

// TODO make these exported types truly immutable
// eslint-disable-next-line functional/type-declaration-immutability
export type OnPremIssue = Readonly<T.TypeOf<typeof OnPremIssue>>;

// eslint-disable-next-line functional/type-declaration-immutability
export type CloudIssue = Readonly<T.TypeOf<typeof CloudIssue>>;

// eslint-disable-next-line functional/type-declaration-immutability
export type Issue = Readonly<T.TypeOf<typeof Issue>>;

// eslint-disable-next-line functional/type-declaration-immutability
export type IssueComment = Readonly<T.TypeOf<typeof IssueComment>>;

// eslint-disable-next-line functional/type-declaration-immutability
export type IssueChangeLog = Readonly<T.TypeOf<typeof ChangeLog>>;

// eslint-disable-next-line functional/type-declaration-immutability
export type IssueWorklog = Readonly<T.TypeOf<typeof IssueWorklog>>;

export const BoardColumn = T.readonly(
  T.type({
    name: T.string,
    statuses: T.readonlyArray(
      T.readonly(
        T.type({
          id: T.string,
        })
      )
    ),
  })
);

export type BoardColumn = Readonly<T.TypeOf<typeof BoardColumn>>;

export const Board = T.readonly(
  T.type({
    id: T.number,
    name: T.string,
    type: T.string,
    columnConfig: T.readonly(
      T.type({
        columns: T.readonlyArray(BoardColumn),
        constraintType: T.string,
      })
    ),
  })
);

// eslint-disable-next-line functional/type-declaration-immutability
export type Board = Readonly<T.TypeOf<typeof Board>>;

export const BoardSummary = T.readonly(
  T.type({
    id: T.number,
    name: T.string,
  })
);

export type BoardSummary = T.TypeOf<typeof BoardSummary>;

// eslint-disable-next-line functional/type-declaration-immutability
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
  readonly lastWorked?: ReadonlyDate; // The last time that there was evidence the ticket was actively worked (e.g. there was a transition, worklog or comment added).
  readonly quality: string | undefined;
  readonly qualityReason: string | undefined; // The reason that the issue has the quality rating it does.
  readonly description: string | undefined; // The effective description for the issue (taking into account any custom description fields).
};

export const User = T.readonly(
  T.type({
    name: T.string,
    emailAddress: T.string,
    displayName: T.string,
  })
);

export type User = T.TypeOf<typeof User>;

/**
 * Error type returned by the Jira API.
 *
 * When updating an issue, `errors` may contain per-field errors.
 */
export const JiraError = T.readonly(
  T.type({
    name: T.string,
    statusCode: T.number,
    message: T.string,
    error: T.readonly(
      T.type({
        errors: T.readonly(T.UnknownRecord),
      })
    ),
  })
);

export type JiraError = Readonly<T.TypeOf<typeof JiraError>>;

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

/**
 * Finds the changelogs where the status of the issue was changed (i.e. there was a transition).
 * @param issue the issue whose transitions should be found.
 * @returns the changelogs where the status changed.
 */
export const issueTransitions = (issue: Issue): readonly IssueChangeLog[] => {
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
  issue: Issue
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
  issue: Issue
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
  issue: Issue
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
export const issueLastWorked = (issue: Issue): ReadonlyDate | undefined => {
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
  issue: Issue,
  viewLink: string,
  qualityFieldName: string,
  qualityReasonFieldName: string,
  descriptionFields: ReadonlyRecord<string, string>,
  board?: Board
): EnhancedIssue => {
  const mostRecentTransition = mostRecentIssueTransition(issue);

  const mostRecentComment = mostRecentIssueComment(issue);

  const released = issue.fields.fixVersions.some((version) => version.released);

  const lastWorked = issueLastWorked(issue);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const quality = issue.fields[qualityFieldName] as string | undefined;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const qualityReason = issue.fields[qualityReasonFieldName] as
    | string
    | undefined;

  const descriptionField =
    descriptionFields[issue.fields.issuetype.name.toLowerCase()];

  const description = [
    descriptionField === undefined
      ? undefined
      : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (issue.fields[descriptionField] as string | undefined | null),
    issue.fields.description,
  ].find((s) => s !== undefined && s !== null && s.length > 0);

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
    description: description === null ? undefined : description,
  };
};

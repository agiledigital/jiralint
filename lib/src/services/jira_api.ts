/* eslint-disable functional/functional-parameters */
import { Either } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { OAuth } from "oauth";
import JiraApi, { JsonResponse } from "jira-client";
import {
  Issue,
  Board,
  BoardSummary,
  IssueComment,
  enhancedIssue,
  EnhancedIssue,
  User,
  JiraError,
  IssueWorklog,
} from "./jira";
import * as T from "io-ts";
import { ReadonlyRecord } from "readonly-types";
import { pipe, flow } from "fp-ts/lib/function";
import { PathReporter } from "io-ts/PathReporter";
import { isLeft } from "fp-ts/lib/These";
import { compareDesc } from "date-fns";

export type Authorised = {
  readonly status: "authorised";
  readonly accessToken: string;
  readonly accessSecret: string;
};

export type Requested = {
  readonly status: "requested";
  readonly requestUrl: string;
  readonly requestSecret: string;
  readonly requestToken: string;
};

type FieldNotEditable = {
  readonly fields: ReadonlyArray<string>;
};

export type JiraClient = {
  readonly startSignIn: () => Promise<Requested>;
  readonly getAccessToken: (
    request: Requested,
    verificationCode: string
  ) => Promise<Authorised>;
  readonly jiraApi: (accessToken: string, accessSecret: string) => JiraApi;
  readonly updateIssueQuality: (
    key: string,
    quality: string,
    reason: string,
    jiraApi: JiraApi,
    qualityField: string,
    qualityReasonField: string
  ) => Promise<Either<string | FieldNotEditable | JiraError, JsonResponse>>;
  readonly searchIssues: (
    jql: string,
    jiraApi: JiraApi,
    boardNamesToIgnore: readonly string[],
    qualityField: string,
    qualityReasonField: string,
    customFieldNames: readonly string[]
  ) => Promise<Either<string, ReadonlyArray<EnhancedIssue>>>;
  readonly currentUser: (jiraApi: JiraApi) => Promise<Either<string, User>>;
};

/**
 * An abstraction over the raw Jira API, with useful functions in the context of this project.
 * @param jiraProtocol
 * @param jiraHost
 * @param jiraConsumerKey
 * @param jiraConsumerSecret
 * @returns The Jira API abstraction.
 */
export const jiraClient = (
  jiraProtocol: string,
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string
): JiraClient => {
  const oauth = new OAuth(
    `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/request-token`,
    `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/access-token`,
    jiraConsumerKey,
    jiraConsumerSecret,
    "1.0",
    "oob", // Out-of-band - request that Jira displays the verification code to the user when they follow the auth link.
    "RSA-SHA1"
  );

  /**
   * Maps the left side of a validation error into a human readable form. Leaves the right as is.
   *
   * @param validation the validation whose left should be mapped.
   * @returns the mapped validation.
   */
  const mapValidationError = <T>(
    validation: T.Validation<T>
  ): Either<string, T> =>
    E.isLeft(validation)
      ? E.left(JSON.stringify(PathReporter.report(validation)))
      : validation;

  /**
   * Decodes a value using the supplied decoder and maps errors to a readable form.
   *
   * @param name name of the decoded type for reporting.
   * @param input value to be decoded.
   * @param decoder decoder to apply to the value.
   * @returns either a human readable error or the decoded value.
   */
  const decode = <I, O>(
    name: string,
    input: I,
    decoder: (i: I) => T.Validation<O>
  ): Either<string, O> =>
    pipe(
      input,
      decoder,
      mapValidationError,
      E.mapLeft(
        (error) =>
          `Failed to decode ${name} [${error}] [${JSON.stringify(
            input,
            null,
            2
          )}].`
      )
    );

  const boardDetails =
    (jiraApi: JiraApi) =>
    (id: number): TE.TaskEither<string, Board> => {
      const fetch = (id: number): TE.TaskEither<string, JiraApi.JsonResponse> =>
        TE.tryCatch(
          () => jiraApi.getConfiguration(id.toString()),
          (reason: unknown) =>
            `Failed to fetch board [${id}] for [${JSON.stringify(reason)}].`
        );

      const parsed = (
        response: JiraApi.JsonResponse
      ): TE.TaskEither<string, Board> =>
        // eslint-disable-next-line @typescript-eslint/unbound-method
        TE.fromEither(decode("board", response, Board.decode));

      return flow(fetch, TE.chain(parsed))(id);
    };

  const boardsForProject =
    (jiraApi: JiraApi, boardNamesToIgnore: readonly string[]) =>
    (
      projectKey: string
    ): TE.TaskEither<string, ReadonlyRecord<string, ReadonlyArray<Board>>> => {
      const fetch = TE.tryCatch(
        () =>
          jiraApi.getAllBoards(
            undefined,
            undefined,
            "kanban",
            undefined,
            projectKey
          ),
        (reason: unknown) =>
          `Failed to fetch board for project [${projectKey}] for [${JSON.stringify(
            reason
          )}].`
      );

      const parsed = (
        response: JiraApi.JsonResponse
      ): TE.TaskEither<string, ReadonlyArray<BoardSummary>> =>
        TE.fromEither(
          decode(
            "board summaries",
            response["values"],
            // eslint-disable-next-line @typescript-eslint/unbound-method
            T.array(BoardSummary).decode
          )
        );

      const boardIds = (
        boards: ReadonlyArray<BoardSummary>
      ): TE.TaskEither<string, ReadonlyArray<number>> => {
        const ids: ReadonlyArray<number> = boards
          .filter(
            (board) =>
              !boardNamesToIgnore.some((prefix) =>
                board.name.toLowerCase().startsWith(prefix)
              )
          )
          .map((board) => board.id);
        return TE.right(ids);
      };

      return pipe(
        fetch,
        TE.chain(parsed),
        TE.chain(boardIds),
        TE.chain(TE.traverseSeqArray(boardDetails(jiraApi))),
        TE.map((boards) => ({
          [projectKey]: boards,
        }))
      );
    };

  const boardsByProject = (
    issues: ReadonlyArray<Issue>,
    jiraApi: JiraApi,
    boardNamesToIgnore: readonly string[]
  ): TE.TaskEither<string, ReadonlyRecord<string, ReadonlyArray<Board>>> => {
    const projectKeys: readonly string[] = issues
      .map((issue) => issue.fields.project.key)
      .filter((value, index, self) => self.indexOf(value) === index);
    const boards: TE.TaskEither<
      string,
      ReadonlyArray<ReadonlyRecord<string, ReadonlyArray<Board>>>
    > = TE.traverseSeqArray(boardsForProject(jiraApi, boardNamesToIgnore))(
      projectKeys
    );

    return TE.map(
      (bs: ReadonlyArray<ReadonlyRecord<string, ReadonlyArray<Board>>>) =>
        bs.reduce(
          (prev, current) => ({
            ...prev,
            ...current,
          }),
          {}
        )
    )(boards);
  };

  const fetchMostRecentWorklogs = (
    issueKey: string,
    jiraApi: JiraApi
  ): TE.TaskEither<string, ReadonlyArray<IssueWorklog>> => {
    const fetch = TE.tryCatch(
      () => jiraApi.genericGet(`issue/${encodeURIComponent(issueKey)}/worklog`),
      (error) =>
        `Failed to fetch worklogs for [${issueKey}] - [${JSON.stringify(
          error,
          null,
          2
        )}].`
    );

    const parsed = (
      response: JiraApi.JsonResponse
    ): TE.TaskEither<string, ReadonlyArray<IssueWorklog>> =>
      TE.fromEither(
        decode(
          "worklogs",
          response["worklogs"],
          // eslint-disable-next-line @typescript-eslint/unbound-method
          T.readonlyArray(IssueWorklog).decode
        )
      );

    return pipe(fetch, TE.chain(parsed));
  };

  const fetchMostRecentComments = (
    issueKey: string,
    jiraApi: JiraApi
  ): TE.TaskEither<string, ReadonlyArray<IssueComment>> => {
    const fetch = TE.tryCatch(
      () =>
        jiraApi.genericGet(
          `issue/${encodeURIComponent(
            issueKey
          )}/comment?maxResults=1&orderBy=-created`
        ),
      (error) =>
        `Failed to fetch most recent comment for [${issueKey}] - [${JSON.stringify(
          error,
          null,
          2
        )}].`
    );

    const parsed = (
      response: JiraApi.JsonResponse
    ): TE.TaskEither<string, ReadonlyArray<IssueComment>> =>
      TE.fromEither(
        decode(
          "comments",
          response["comments"],
          // eslint-disable-next-line @typescript-eslint/unbound-method
          T.readonlyArray(IssueComment).decode
        )
      );

    return pipe(fetch, TE.chain(parsed));
  };

  const issueLink = (issue: Issue): string =>
    `${jiraProtocol}://${jiraHost}/browse/${encodeURIComponent(issue.key)}`;

  return {
    /**
     * Requests a temporary token from Jira for the user to authorise access.
     *
     * Once the user follows the request url and receives a verification code, this
     * temporary token can be exchange for access tokens.
     *
     * @see getAccessToken
     *
     * @returns the temporary request tokens.
     */
    startSignIn: async (): Promise<Requested> =>
      new Promise((resolve, reject) => {
        // eslint-disable-next-line functional/no-expression-statement
        oauth.getOAuthRequestToken(
          (err: unknown, requestToken: string, requestSecret: string) => {
            // eslint-disable-next-line functional/no-conditional-statement
            if (err !== null) {
              // eslint-disable-next-line functional/no-expression-statement
              reject(`Failed to get request token [${JSON.stringify(err)}].`);
            } else {
              const requestUrl = `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/authorize?oauth_token=${requestToken}`;

              // eslint-disable-next-line functional/no-expression-statement
              resolve({
                status: "requested",
                requestUrl,
                requestSecret,
                requestToken,
              });
            }
          }
        );
      }),

    /**
     * Exchanges the temporary request token and secret for an access token and secret, using
     * the verification code to prove that the user authorised the application to use the API.
     *
     * @see startSignIn
     *
     * @param request the request details
     * @param verificationCode the verification code supplied to the user by Jira.
     * @returns the access tokens.
     */
    getAccessToken: async (
      request: Requested,
      verificationCode: string
    ): Promise<Authorised> =>
      new Promise((resolve, reject) => {
        // eslint-disable-next-line functional/no-expression-statement
        oauth.getOAuthAccessToken(
          request.requestToken,
          request.requestSecret,
          verificationCode,
          (err: unknown, accessToken: string, accessSecret: string) => {
            // eslint-disable-next-line functional/no-conditional-statement
            if (err !== null) {
              // eslint-disable-next-line functional/no-expression-statement
              reject(JSON.stringify(err, null, 2));
            } else {
              // eslint-disable-next-line functional/no-expression-statement
              resolve({
                status: "authorised",
                accessToken,
                accessSecret,
              });
            }
          }
        );
      }),

    /**
     * Creates a Jira API client that is configured to use authorised access tokens.
     *
     * @param consumerSecret Jira consumer secret.
     * @param accessToken users access token.
     * @param accessSecret users access secret.
     * @returns the new Jira API client.
     */
    jiraApi: (accessToken: string, accessSecret: string): JiraApi =>
      new JiraApi({
        protocol: jiraProtocol,
        host: jiraHost,
        oauth: {
          consumer_key: jiraConsumerKey,
          consumer_secret: jiraConsumerSecret,
          access_token: accessToken,
          access_token_secret: accessSecret,
        },
      }),

    /**
     * Updates the rated quality of an issue.
     *
     * @param key key that identifies the issue.
     * @param quality rated quality to be recorded.
     * @param reason reason that the rated quality was recorded.
     * @param jiraApi API used to effect the update.
     * @param qualityField The name of the custom field used to store issue quality.
     * @param qualityReasonField The name of the custom field used to store issue quality reason.
     * @returns the result of doing the update
     */
    updateIssueQuality: async (
      key: string,
      quality: string,
      reason: string,
      jiraApi: JiraApi,
      qualityField: string,
      qualityReasonField: string
    ): Promise<Either<string | FieldNotEditable | JiraError, JsonResponse>> => {
      const updateIssue = TE.tryCatch(
        () =>
          jiraApi.updateIssue(key, {
            fields: {
              [qualityField]: quality,
              [qualityReasonField]: reason,
            },
          }),
        (error: unknown) => {
          const jiraError = JiraError.decode(error);
          return isLeft(jiraError)
            ? `Unexpected error from Jira when updating quality of [${key}] to [${quality}] - [${JSON.stringify(
                error,
                null,
                2
              )}]`
            : jiraError.right;
        }
      );

      const mapError = TE.mapLeft((error: string | JiraError) => {
        const fieldNotSettableError = (
          jiraError: JiraError,
          fieldName: string
        ): boolean => {
          const field = jiraError.error.errors[fieldName];
          return typeof field === "string"
            ? field.indexOf(
                "cannot be set. It is not on the appropriate screen"
              ) > -1
            : false;
        };

        return typeof error === "string"
          ? error
          : fieldNotSettableError(error, qualityField)
          ? {
              fields: [qualityField],
            }
          : error;
      });

      return pipe(updateIssue, mapError)();
    },

    /**
     * Searches for issues that match the provided JQL statement and performs some simple
     * augmentation to add useful information (e.g whether they are - given the board configuration - in progress).
     *
     * Note: this function does not return *all* matching issues. It makes no
     * effort to pull additional search results if they original request is
     * truncated.
     *
     * @param jql query statement used to search for issues.
     * @param jiraApi API used to retrieve the user details.
     * @param boardNamesToIgnore Prefix of the name of boards to be ignored when determining the 'column' that a ticket is currently in.
     *                           This column is used as proxy for the status of tickets in some circumstances (e.g. to
     *                           abstract over the statuses of different issue types.)
     * @param qualityField The name of the custom field used to store issue quality.
     * @param qualityReasonField The name of the custom field used to store the reason an issue has been rated at a quality.
     * @param customFieldNames List of other custom issue field names to include when retrieving issues from Jira. Must be specified explicitly, sadly.
     *                         If you want to use a custom field in a rule, you must specify it here.
     * @returns either an error or the enhanced issues.
     */
    searchIssues: async (
      jql: string,
      jiraApi: JiraApi,
      boardNamesToIgnore: readonly string[],
      qualityField: string,
      qualityReasonField: string,
      customFieldNames: readonly string[]
    ): Promise<Either<string, ReadonlyArray<EnhancedIssue>>> => {
      const fetchIssues = TE.tryCatch(
        () =>
          jiraApi.searchJira(jql, {
            fields: [
              "status",
              "summary",
              "fixVersions",
              "description",
              "issuetype",
              "project",
              "assignee",
              "timetracking",
              "comment",
              "subtasks",
              "aggregateprogress",
              "aggregatetimeestimate",
              "aggregatetimeoriginalestimate",
              "aggregatetimespent",
              "created",
              "parent",
              "duedate",
              qualityField,
              qualityReasonField,
              ...customFieldNames,
            ],
            expand: ["changelog"],
          }),
        (error: unknown) =>
          `Error fetching details from jira with query [${jql}] - [${JSON.stringify(
            error
          )}].`
      );

      const parsed = (
        response: JiraApi.JsonResponse
      ): TE.TaskEither<string, ReadonlyArray<Issue>> =>
        TE.fromEither(
          decode(
            "issues",
            response["issues"],
            // eslint-disable-next-line @typescript-eslint/unbound-method
            T.readonly(T.array(Issue)).decode
          )
        );

      const enhancedIssues = (
        issues: ReadonlyArray<Issue>
      ): TE.TaskEither<string, ReadonlyArray<EnhancedIssue>> => {
        return TE.map(
          (boards: ReadonlyRecord<string, ReadonlyArray<Board>>) => {
            return issues.map((issue) => {
              const issueBoards = boards[issue.fields.project.key] ?? [];
              const boardByStatus = issueBoards.find((board) =>
                board.columnConfig.columns.some((column) =>
                  column.statuses.some(
                    (status) => status.id === issue.fields.status.id
                  )
                )
              );
              return enhancedIssue(issue, issueLink(issue), boardByStatus);
            });
          }
        )(boardsByProject(issues, jiraApi, boardNamesToIgnore));
      };

      const issueWithComment = (
        issue: EnhancedIssue
      ): TE.TaskEither<string, EnhancedIssue> => {
        const mostRecentCommentLoaded =
          issue.fields.comment !== undefined &&
          issue.fields.comment.total === issue.fields.comment.comments.length;

        const recentComment = (
          worklogs: ReadonlyArray<IssueComment> | undefined
        ): IssueComment | undefined =>
          worklogs === undefined
            ? undefined
            : [...worklogs].sort((w1, w2) =>
                compareDesc(w1.created.valueOf(), w2.created.valueOf())
              )[0];

        return pipe(
          mostRecentCommentLoaded
            ? TE.right(issue.fields.comment?.comments)
            : fetchMostRecentComments(issue.key, jiraApi),
          TE.map((comments) => ({
            ...issue,
            mostRecentComment: recentComment(comments),
          }))
        );
      };

      const issueWithWorklog = (
        issue: EnhancedIssue
      ): TE.TaskEither<string, EnhancedIssue> => {
        const mostRecentWorklogLoaded =
          issue.fields.worklog !== undefined &&
          issue.fields.worklog.total === issue.fields.worklog.worklogs.length;

        const recentWorklog = (
          worklogs: ReadonlyArray<IssueWorklog> | undefined
        ): IssueWorklog | undefined =>
          worklogs === undefined
            ? undefined
            : [...worklogs].sort((w1, w2) =>
                compareDesc(w1.started.valueOf(), w2.started.valueOf())
              )[0];

        return pipe(
          mostRecentWorklogLoaded
            ? TE.right(issue.fields.worklog?.worklogs)
            : fetchMostRecentWorklogs(issue.key, jiraApi),
          TE.map((worklogs) => ({
            ...issue,
            mostRecentWorklog: recentWorklog(worklogs),
          }))
        );
      };

      return pipe(
        fetchIssues,
        TE.chain(parsed),
        TE.chain(enhancedIssues),
        TE.chain(TE.traverseSeqArray((issue) => issueWithComment(issue))),
        TE.chain(TE.traverseSeqArray((issue) => issueWithWorklog(issue)))
      )();
    },

    /**
     * Fetches the details of the current user.
     *
     * @param jiraApi API used to retrieve the user details.
     * @returns either an error or the user details.
     */
    currentUser: async (jiraApi: JiraApi): Promise<Either<string, User>> => {
      const fetchUser = TE.tryCatch(
        () => jiraApi.getCurrentUser(),
        (error: unknown) =>
          `Error fetching current user - [${JSON.stringify(error)}]`
      );

      const parsed = (
        fetchResult: JiraApi.JsonResponse
      ): TE.TaskEither<string, User> =>
        TE.fromEither(
          decode(
            "user",
            fetchResult,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            User.decode
          )
        );

      return pipe(fetchUser, TE.chain(parsed))();
    },
  };
};

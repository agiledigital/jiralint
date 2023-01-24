/* eslint-disable spellcheck/spell-checker */
import { Either } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { OAuth } from "oauth";
import JiraApi, { JsonResponse } from "jira-client";
import {
  Board,
  BoardSummary,
  IssueComment,
  enhancedIssue,
  EnhancedIssue,
  User,
  JiraError,
  IssueWorklog,
  JiraIssue,
  OnPremJiraIssue,
  CloudJiraIssue,
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
  readonly requestSecret: string;
  readonly requestToken: string;
};

type FieldNotEditable = {
  readonly fields: readonly string[];
};

// FIXME:  turn this into a class so your editor "go to source" works and you
// only need to document the functions in one place
export type JiraClient = {
  readonly jiraApi: JiraApi;
  readonly updateIssueQuality: (
    key: string,
    quality: string,
    reason: string,
    qualityField: string,
    qualityReasonField: string
  ) => Promise<Either<string | FieldNotEditable | JiraError, JsonResponse>>;
  readonly searchIssues: (
    jql: string,
    boardNamesToIgnore: readonly string[],
    qualityField: string,
    qualityReasonField: string,
    customFieldNames: readonly string[]
  ) => Promise<Either<string, readonly EnhancedIssue[]>>;
  readonly currentUser: () => Promise<Either<string, User>>;
};

/**
 * Using OAuth and the consumer key and secret you created using the
 * instructions from:
 *     https://developer.atlassian.com/server/jira/platform/oauth/
 *
 * Create the access token and access secret that you can then use for the rest
 * of your session to access Jira with the JiraClient
 *
 * @param jiraProtocol the protocol to use to connect to Jira: http or https
 * @param jiraHost the Jira hostname: e.g. jira.example.com
 * @param jiraConsumerKey the Jira consumer key name set when creating the key
 * @param jiraConsumerSecret Jira consumer secret - the full text of PEM file
 * @param secretCallback function that takes a request URL which you can use
 *   to sign in and get the secret
 * @returns the access token and access secret to use in requests to Jira
 */
export const getOAuthAccessToken = async (
  jiraProtocol: "http" | "https",
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string,
  secretCallback: (requestUrl: string) => Promise<string>
): Promise<Authorised> => {
  const oauth = new OAuth(
    `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/request-token`,
    `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/access-token`,
    jiraConsumerKey,
    jiraConsumerSecret,
    "1.0",
    "oob", // Out-of-band - request that Jira displays the verification code to the user when they follow the auth link.
    "RSA-SHA1"
  );

  const { requestToken, requestSecret } = await new Promise<{
    readonly requestSecret: string;
    readonly requestToken: string;
    // eslint-disable-next-line functional/no-return-void
  }>((resolve, reject) => {
    // eslint-disable-next-line functional/no-expression-statement
    oauth.getOAuthRequestToken(
      // eslint-disable-next-line functional/no-return-void
      (err: unknown, requestToken: string, requestSecret: string) => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (err !== null) {
          // eslint-disable-next-line functional/no-expression-statement
          reject(`Failed to get request token [${JSON.stringify(err)}].`);
        } else {
          // eslint-disable-next-line functional/no-expression-statement
          resolve({
            requestSecret,
            requestToken,
          });
        }
      }
    );
  });

  // pass the request URL back to the caller so they can get the user to
  // retrieve the secret we need to create the access token and secret.
  const requestUrl = `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/authorize?oauth_token=${requestToken}`;
  const verificationCode: string = await secretCallback(requestUrl);

  // Exchanges the temporary request token and secret for an access token and secret, using
  //the verification code to prove that the user authorised the application to use the API.
  // eslint-disable-next-line functional/no-return-void
  return new Promise<Authorised>((resolve, reject) => {
    // eslint-disable-next-line functional/no-expression-statement
    oauth.getOAuthAccessToken(
      requestToken,
      requestSecret,
      verificationCode,
      // eslint-disable-next-line functional/no-return-void
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
  });
};

/**
 * Create a Jira Client using OAuth to authenticate. The access token and access
 * secret are created with getOAuthAccessToken.
 *
 * This is the recommended authentication method.
 *
 * @param jiraProtocol the protocol to use to connect to Jira: http or https
 * @param jiraHost the Jira hostname: e.g. jira.example.com
 * @param jiraConsumerKey the Jira consumer key name set when creating the key
 * @param jiraConsumerSecret Jira consumer secret - the full text of PEM file
 * @param accessToken the Jira OAuth access token
 * @param accessSecret the Jira OAuth access secret
 * @returns The Jira API abstraction.
 */
export const jiraClientWithOAuth = (
  jiraProtocol: "http" | "https",
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string,
  accessToken: string,
  accessSecret: string
): JiraClient => {
  const jiraApi: JiraApi = new JiraApi({
    protocol: jiraProtocol,
    host: jiraHost,
    oauth: {
      consumer_key: jiraConsumerKey,
      consumer_secret: jiraConsumerSecret,
      access_token: accessToken,
      access_token_secret: accessSecret,
    },
  });

  return jiraClient(jiraProtocol, jiraHost, jiraApi);
};

/**
 * Create a Jira Client using a user's personal access token. To create a
 * personal access token, see:
 * https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html
 *
 * This is the preferred authentication method when OAuth is unavailable because
 * you don't have the Jira privileges to create a consumer token.
 *
 * @param personalAccessToken user personal access token
 * @param jiraProtocol the protocol to use to connect to Jira: http or https
 * @param jiraHost the Jira hostname: e.g. jira.example.com
 * @returns The Jira API abstraction.
 */
export const jiraClientWithPersonnelAccessToken = (
  jiraProtocol: "http" | "https",
  jiraHost: string,
  personalAccessToken: string
): JiraClient => {
  const jiraApi: JiraApi = new JiraApi({
    protocol: jiraProtocol,
    host: jiraHost,
    bearer: personalAccessToken,
  });

  return jiraClient(jiraProtocol, jiraHost, jiraApi);
};

/**
 * Create a Jira Client using a user's username and password which they use to
 * log into Jira. We recommend avoiding this method if possible.
 *
 * @param username user personal username
 * @param password user personal password
 * @param jiraProtocol the protocol to use to connect to Jira: http or https
 * @param jiraHost the Jira hostname: e.g. jira.example.com
 * @returns The Jira API abstraction.
 */
export const jiraClientWithUserCredentials = (
  jiraProtocol: "http" | "https",
  jiraHost: string,
  username: string,
  password: string
): JiraClient => {
  const jiraApi: JiraApi = new JiraApi({
    protocol: jiraProtocol,
    host: jiraHost,
    username,
    password,
    apiVersion: "2",
  });

  return jiraClient(jiraProtocol, jiraHost, jiraApi);
};

/**
 * An abstraction over the raw Jira API, with useful functions in the context of this project.
 * @param jiraProtocol
 * @param jiraHost
 * @param jiraApi
 * @returns The Jira API abstraction.
 */
const jiraClient = (
  jiraProtocol: "http" | "https",
  jiraHost: string,
  jiraApi: JiraApi
): JiraClient => {
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
          // eslint-disable-next-line functional/functional-parameters
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
    ): TE.TaskEither<string, ReadonlyRecord<string, readonly Board[]>> => {
      const fetch = TE.tryCatch(
        // eslint-disable-next-line functional/functional-parameters
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
      ): TE.TaskEither<string, readonly BoardSummary[]> =>
        TE.fromEither(
          decode(
            "board summaries",
            response.values,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            T.array(BoardSummary).decode
          )
        );

      const boardIds = (
        boards: readonly BoardSummary[]
      ): TE.TaskEither<string, readonly number[]> => {
        const ids: readonly number[] = boards
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
    issues: readonly JiraIssue[],
    boardNamesToIgnore: readonly string[]
  ): TE.TaskEither<string, ReadonlyRecord<string, readonly Board[]>> => {
    const projectKeys: readonly string[] = issues
      .map((issue) => issue.fields.project.key)
      .filter((value, index, self) => self.indexOf(value) === index);
    const boards: TE.TaskEither<
      string,
      readonly ReadonlyRecord<string, readonly Board[]>[]
    > = TE.traverseSeqArray(boardsForProject(jiraApi, boardNamesToIgnore))(
      projectKeys
    );

    return TE.map((bs: readonly ReadonlyRecord<string, readonly Board[]>[]) =>
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
    issueKey: string
  ): TE.TaskEither<string, readonly IssueWorklog[]> => {
    const fetch = TE.tryCatch(
      // eslint-disable-next-line functional/functional-parameters
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
    ): TE.TaskEither<string, readonly IssueWorklog[]> =>
      TE.fromEither(
        decode(
          "worklogs",
          response.worklogs,
          // eslint-disable-next-line @typescript-eslint/unbound-method
          T.readonlyArray(IssueWorklog).decode
        )
      );

    return pipe(fetch, TE.chain(parsed));
  };

  const fetchMostRecentComments = (
    issueKey: string
  ): TE.TaskEither<string, readonly IssueComment[]> => {
    const fetch = TE.tryCatch(
      // eslint-disable-next-line functional/functional-parameters
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
    ): TE.TaskEither<string, readonly IssueComment[]> =>
      TE.fromEither(
        decode(
          "comments",
          response.comments,
          // eslint-disable-next-line @typescript-eslint/unbound-method
          T.readonlyArray(IssueComment).decode
        )
      );

    return pipe(fetch, TE.chain(parsed));
  };

  const issueLink = (issue: JiraIssue): string =>
    `${jiraProtocol}://${jiraHost}/browse/${encodeURIComponent(issue.key)}`;

  return {
    jiraApi,
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
      qualityField: string,
      qualityReasonField: string
    ): Promise<Either<string | FieldNotEditable | JiraError, JsonResponse>> => {
      const updateIssue = TE.tryCatch(
        // eslint-disable-next-line functional/functional-parameters
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
            ? field.includes(
                "cannot be set. It is not on the appropriate screen"
              )
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
      boardNamesToIgnore: readonly string[],
      qualityField: string,
      qualityReasonField: string,
      customFieldNames: readonly string[]
    ): Promise<Either<string, readonly EnhancedIssue[]>> => {
      const fetchIssues = TE.tryCatch(
        // eslint-disable-next-line functional/functional-parameters
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

      const convertIssueType = (
        response: JiraApi.JsonResponse
      ): TE.TaskEither<string, readonly JiraIssue[]> => {
        return jiraHost.includes("atlassian")
          ? pipe(
              parseCloudJira(response), //reponse to cloudIssueType
              TE.chain(
                TE.traverseSeqArray((cloudJiraIssue) =>
                  cloudJiraToGeneric(cloudJiraIssue)
                )
              )
            )
          : pipe(
              parseOnPremJira(response),
              TE.chain(
                TE.traverseSeqArray((onPremJiraIssue) =>
                  onPremJiraToGeneric(onPremJiraIssue)
                )
              )
            );
      };

      const parseOnPremJira = (
        response: JiraApi.JsonResponse
      ): TE.TaskEither<string, readonly OnPremJiraIssue[]> =>
        TE.fromEither(
          decode(
            "issues", //name
            response.issues, //input
            // eslint-disable-next-line @typescript-eslint/unbound-method
            T.readonly(T.array(OnPremJiraIssue)).decode //decoder
          )
        );

      const parseCloudJira = (
        response: JiraApi.JsonResponse
      ): TE.TaskEither<string, readonly CloudJiraIssue[]> =>
        TE.fromEither(
          decode(
            "issues", //name
            response.issues, //input
            // eslint-disable-next-line @typescript-eslint/unbound-method
            T.readonly(T.array(CloudJiraIssue)).decode //decoder)
          )
        );

      /**
       * @param onPremJiraIssue - an instance of OnPremJiraIssue
       * @returns JiraIssue
       */
      const onPremJiraToGeneric = (
        onPremJiraIssue: OnPremJiraIssue
      ): TE.TaskEither<string, JiraIssue> =>
        TE.fromEither(
          decode(
            "onpremconversion",
            {
              ...onPremJiraIssue,
              fields: {
                ...onPremJiraIssue.fields,
                assignee: {
                  name: onPremJiraIssue.fields.assignee.name.toString(),
                },
              },
            },
            // eslint-disable-next-line @typescript-eslint/unbound-method
            JiraIssue.decode
          )
        );

      /**
       * @param cloudJiraIssue - an instance of CloudJiraIssue
       * @returns JiraIssue
       */
      const cloudJiraToGeneric = (
        cloudJiraIssue: CloudJiraIssue
      ): TE.TaskEither<string, JiraIssue> =>
        TE.fromEither(
          decode(
            "cloudconversion",
            {
              ...cloudJiraIssue,
              fields: {
                ...cloudJiraIssue.fields,
                assignee: {
                  name: cloudJiraIssue.fields.assignee.displayName.toString(),
                },
              },
            },
            // eslint-disable-next-line @typescript-eslint/unbound-method
            JiraIssue.decode
          )
        );

      const enhancedIssues = (
        issues: readonly JiraIssue[]
      ): TE.TaskEither<string, readonly EnhancedIssue[]> => {
        return TE.map((boards: ReadonlyRecord<string, readonly Board[]>) => {
          return issues.map((issue) => {
            const issueBoards = boards[issue.fields.project.key] ?? [];
            const boardByStatus = issueBoards.find((board) =>
              board.columnConfig.columns.some((column) =>
                column.statuses.some(
                  (status) => status.id === issue.fields.status.id
                )
              )
            );
            return enhancedIssue(
              issue,
              issueLink(issue),
              qualityField,
              qualityReasonField,
              boardByStatus
            );
          });
        })(boardsByProject(issues, boardNamesToIgnore));
      };

      const issueWithComment = (
        issue: EnhancedIssue
      ): TE.TaskEither<string, EnhancedIssue> => {
        const mostRecentCommentLoaded =
          issue.fields.comment !== undefined &&
          issue.fields.comment.total === issue.fields.comment.comments.length;

        const recentComment = (
          worklogs: readonly IssueComment[] | undefined
        ): IssueComment | undefined =>
          worklogs === undefined
            ? undefined
            : [...worklogs].sort((w1, w2) =>
                compareDesc(w1.created.valueOf(), w2.created.valueOf())
              )[0];

        return pipe(
          mostRecentCommentLoaded
            ? TE.right(issue.fields.comment?.comments)
            : fetchMostRecentComments(issue.key),
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
          worklogs: readonly IssueWorklog[] | undefined
        ): IssueWorklog | undefined =>
          worklogs === undefined
            ? undefined
            : [...worklogs].sort((w1, w2) =>
                compareDesc(w1.started.valueOf(), w2.started.valueOf())
              )[0];

        return pipe(
          mostRecentWorklogLoaded
            ? TE.right(issue.fields.worklog?.worklogs)
            : fetchMostRecentWorklogs(issue.key),
          TE.map((worklogs) => ({
            ...issue,
            mostRecentWorklog: recentWorklog(worklogs),
          }))
        );
      };

      return pipe(
        fetchIssues,
        TE.chain(convertIssueType),
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
    // eslint-disable-next-line functional/functional-parameters
    currentUser: async (): Promise<Either<string, User>> => {
      const fetchUser = TE.tryCatch(
        // eslint-disable-next-line functional/functional-parameters
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

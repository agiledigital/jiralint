/* eslint-disable functional/functional-parameters */
import { Either } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { OAuth } from "oauth";
import JiraApi from "jira-client";
import {
  Issue,
  Board,
  BoardSummary,
  enhancedIssue,
  AccountField,
  EnhancedIssue,
  User,
} from "./jira";
import * as T from "io-ts";
import { ReadonlyRecord } from "readonly-types";
import { pipe, flow } from "fp-ts/lib/function";
import { PathReporter } from "io-ts/PathReporter";

const privKey = `-----BEGIN PRIVATE KEY-----
MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAN2x/ovMRTUt3qIy
GXRih/RihX4VTHp7FoXz5XtE2EVCv3ghRYAH/mRLAkX0QeRf36/RoXQpnZBc4iiv
vmmogD2tVJCahgjGfLUy9dWnngRyQx2ac4BrQJBwHB0vTWvRLpBeMzBRka8aHF8m
jr08/uYmeaxauIAniVGTftdDYo0FAgMBAAECgYBamMirHJkTuGEI62xXkYR5rGFd
Oxr72p1DtH4NN/8hnrtcPkyGm72sArM1HzJmP3/L++D89Zy8SBjsA5XO29s7loP9
YrVEFHqpj/6w5cHJMpqC6GShodBU8QG1pJUCveSGdyWUdrn1gBdCLXZBrtqhmZw8
wc473tnFBECrv6v6AQJBAPHYApw4fpYCZ+Emnsk8RNzzIMp0dESZVXJ7r2bs7FQD
zex+PRL135BcUjA2nRFk+sFttmlz/UYvmngxZ8H1oMECQQDqrA/ochDCM7ONfcQa
Z1cy8AERJwpoNPWBbzIOtAwRrWdkOouzxk5rU8llEU3ehGh/AnS1f1adAm1GfdJM
83lFAkBt1L7iuZlrgO4yRzrHgzJ28YeLyjVfTg+LLXasFJ8DTLMBWxdbfAQq6HJ+
6N6OHsDuhWfZHk8Ax++r9Cv93xJBAkAry9bgM8GK7Ok6o9kgcF7mw8H/OIEJt7CF
6oG2GsYR2oHsQ7zk3UKvZyCz+wnEWIPECGpNoSlB/jz0pfDEqb/dAkBgVkumDMg2
WopuoPUF1SMVySqvOhaqC96ZL43KN7PXvwK7zNcF88yufnUF0p5s+TbnS7lZsrU0
2VCKlQeBRCWs
-----END PRIVATE KEY-----`;

const jiraProtocol = "https";
const jiraHost = "jira.agiledigital.com.au";

const oauth = new OAuth(
  `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/request-token`,
  `${jiraProtocol}://${jiraHost}/plugins/servlet/oauth/access-token`,
  "jiralintkey",
  privKey,
  "1.0",
  "oob", // Out-of-band - request that Jira displays the verification code to the user when they follow the auth link.
  "RSA-SHA1"
);

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
export const startSignIn = async (): Promise<Requested> =>
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
          console.log(requestToken, requestSecret);

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
  });

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
export const getAccessToken = async (
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
  });

/**
 * Creates a Jira API client that is configured to use authorised access tokens.
 *
 * @param accessToken users access token.
 * @param accessSecret users access secret.
 * @returns the new Jira API client.
 */
export const jiraApiClient = (
  accessToken: string,
  accessSecret: string
): JiraApi =>
  new JiraApi({
    protocol: jiraProtocol,
    host: jiraHost,
    oauth: {
      consumer_key: "jiralintkey",
      consumer_secret: privKey,
      access_token: accessToken,
      access_token_secret: accessSecret,
    },
  });

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

const boardDetails = (jiraApi: JiraApi) => (
  id: number
): TE.TaskEither<string, Board> => {
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

const boardsForProject = (jiraApi: JiraApi) => (
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
      .filter((board) => !board.name.toLowerCase().startsWith("copy of"))
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
  jiraApi: JiraApi
): TE.TaskEither<string, ReadonlyRecord<string, ReadonlyArray<Board>>> => {
  const projectKeys: readonly string[] = issues
    .map((issue) => issue.fields.project.key)
    .filter((value, index, self) => self.indexOf(value) === index);
  const boards: TE.TaskEither<
    string,
    ReadonlyArray<ReadonlyRecord<string, ReadonlyArray<Board>>>
  > = TE.traverseSeqArray(boardsForProject(jiraApi))(projectKeys);

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

const issueLink = (issue: Issue): string =>
  `${jiraHost}://${jiraProtocol}/browse/${issue.key}`;

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
 * @returns either an error or the enhanced issues.
 */
export const searchIssues = async (
  jql: string,
  jiraApi: JiraApi
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
          AccountField,
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
    return TE.map((boards: ReadonlyRecord<string, ReadonlyArray<Board>>) => {
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
    })(boardsByProject(issues, jiraApi));
  };

  return pipe(fetchIssues, TE.chain(parsed), TE.chain(enhancedIssues))();
};

/**
 * Fetches the details of the current user.
 *
 * @param jiraApi API used to retrieve the user details.
 * @returns either an error or the user details.
 */
export const currentUser = async (
  jiraApi: JiraApi
): Promise<Either<string, User>> => {
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
};

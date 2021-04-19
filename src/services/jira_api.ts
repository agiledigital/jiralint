/* eslint-disable functional/functional-parameters */
import { Either } from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import JiraApi from "jira-client";
import {
  Ticket,
  Board,
  BoardSummary,
  enhancedTicket,
  AccountField,
  EnhancedTicket,
} from "./jira";
import * as T from "io-ts";
import { ReadonlyRecord } from "readonly-types";
import { Errors } from "io-ts";
import { pipe, flow } from "fp-ts/lib/function";

const jiraConfig = {
  protocol: "https",
  host: "jira.agiledigital.com.au",
  username: process.env["JIRA_USER_NAME"],
  password: process.env["JIRA_PASSWORD"],
};

const jira = new JiraApi(jiraConfig);

const boardDetails = (id: number): TE.TaskEither<string, Board> => {
  const fetch = (id: number): TE.TaskEither<string, JiraApi.JsonResponse> =>
    TE.tryCatch(
      () => jira.getConfiguration(id.toString()),
      (reason: unknown) =>
        `Failed to fetch board [${id}] for [${JSON.stringify(reason)}].`
    );

  const parsed = (
    response: JiraApi.JsonResponse
  ): TE.TaskEither<string, Board> =>
    pipe(
      TE.fromEither(Board.decode(response)),
      TE.mapLeft(
        (errors: Errors) =>
          `Failed to decode board [${JSON.stringify(errors)}].`
      )
    );

  return flow(fetch, TE.chain(parsed))(id);
};

const boardsForProject = (
  projectKey: string
): TE.TaskEither<string, ReadonlyRecord<string, ReadonlyArray<Board>>> => {
  const fetch = TE.tryCatch(
    () =>
      jira.getAllBoards(undefined, undefined, "kanban", undefined, projectKey),
    (reason: unknown) =>
      `Failed to fetch board for project [${projectKey}] for [${JSON.stringify(
        reason
      )}].`
  );

  const parsed = flow(
    (response: JiraApi.JsonResponse) => {
      const res = T.array(BoardSummary).decode(response["values"]);
      return TE.fromEither(res);
    },
    TE.mapLeft(
      (errors: Errors) => `Failed to decode board [${JSON.stringify(errors)}].`
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
    TE.chain(TE.traverseSeqArray(boardDetails)),
    TE.map((boards) => ({
      [projectKey]: boards,
    }))
  );
};

const boardsByProject = (
  tickets: ReadonlyArray<Ticket>
): TE.TaskEither<string, ReadonlyRecord<string, ReadonlyArray<Board>>> => {
  const projectKeys: readonly string[] = tickets
    .map((ticket) => ticket.fields.project.key)
    .filter((value, index, self) => self.indexOf(value) === index);
  const boards: TE.TaskEither<
    string,
    ReadonlyArray<ReadonlyRecord<string, ReadonlyArray<Board>>>
  > = TE.traverseSeqArray(boardsForProject)(projectKeys);

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

const ticketLink = (ticket: Ticket): string =>
  `${jiraConfig.protocol}://${jiraConfig.host}/browse/${ticket.key}`;

export const searchTickets = async (
  jql: string
): Promise<Either<string, ReadonlyArray<EnhancedTicket>>> => {
  const fetchIssues = TE.tryCatch(
    () =>
      jira.searchJira(jql, {
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
    searchResult: JiraApi.JsonResponse
  ): TE.TaskEither<string, ReadonlyArray<Ticket>> => {
    return pipe(
      TE.fromEither(T.readonly(T.array(Ticket)).decode(searchResult["issues"])),
      TE.mapLeft((errors: Errors) => JSON.stringify(errors))
    );
  };

  const enhancedTickets = (
    tickets: ReadonlyArray<Ticket>
  ): TE.TaskEither<string, ReadonlyArray<EnhancedTicket>> => {
    return TE.map((boards: ReadonlyRecord<string, ReadonlyArray<Board>>) => {
      return tickets.map((issue) => {
        const issueBoards = boards[issue.fields.project.key] ?? [];
        const boardByStatus = issueBoards.find((board) =>
          board.columnConfig.columns.some((column) =>
            column.statuses.some(
              (status) => status.id === issue.fields.status.id
            )
          )
        );
        return enhancedTicket(issue, ticketLink(issue), boardByStatus);
      });
    })(boardsByProject(tickets));
  };

  return pipe(fetchIssues, TE.chain(parsed), TE.chain(enhancedTickets))();
};

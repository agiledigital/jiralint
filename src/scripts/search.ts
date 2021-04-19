import { Argv } from "yargs";
import { RootCommand } from "..";
import { EnhancedTicket } from "../services/jira";
import { searchTickets } from "../services/jira_api";
import { ticketActionRequired } from "../services/issue_checks";
import { isLeft } from "fp-ts/lib/Either";
import { readonlyDate } from "readonly-types/dist";
import {
  formatJiraDistance,
  formatSecondsLikeJira,
} from "../services/jira_date_fns";
import stringLength from "string-length";

import * as CLUI from "clui";
import * as clc from "cli-color";
// eslint-disable-next-line functional/no-expression-statement
require("cli-color");

// eslint-disable-next-line functional/no-return-void
const render = (tickets: ReadonlyArray<EnhancedTicket>): void => {
  const tableHeaders: ReadonlyArray<string> = [
    "Action",
    "Key",
    "Type",
    "Summary",
    "Board",
    "Status",
    "Since",
    "Assignee",
    "Progress",
    "Time Spent",
    "Sign",
  ];

  const alarm: ReadonlyArray<string> = ["Z", "E", "B", "E"];

  const tableHeaderWidths: ReadonlyArray<number> = tableHeaders.map(
    (header) => stringLength(header) + 1
  );

  const outputBuffer = new CLUI.LineBuffer({
    x: 0,
    y: 0,
    width: "console",
    height: "console",
  });

  // eslint-disable-next-line no-restricted-globals
  const now = readonlyDate(new Date());

  const data: ReadonlyArray<
    ReadonlyArray<readonly [string, ReadonlyArray<clc.Format>]>
  > = tickets.map((ticket) => {
    const ticketAction = ticketActionRequired(ticket, now);

    const reasons: readonly unknown[] = ticketAction.checks.flatMap((check) =>
      check.outcome === "warn" || check.outcome === "fail" ? check.reasons : []
    );

    const originalEstimateSeconds =
      ticket.fields.timetracking.originalEstimateSeconds ?? 0;
    const timeSpentSeconds = ticket.fields.timetracking.timeSpentSeconds ?? 0;
    const timeRemainingSeconds =
      ticket.fields.timetracking.remainingEstimateSeconds ?? 0;

    const progressGauge = CLUI.Gauge(
      timeSpentSeconds,
      originalEstimateSeconds + timeRemainingSeconds,
      10,
      originalEstimateSeconds,
      ""
    );

    const timeSinceLastTransition =
      ticket.mostRecentTransition !== undefined
        ? formatJiraDistance(now, ticket.mostRecentTransition.created)
        : "";

    const noFormat: ReadonlyArray<clc.Format> = [clc.white];

    return [
      [
        ticketAction.actionRequired === "inspect"
          ? alarm[reasons.length] ?? "E"
          : "",
        noFormat,
      ],
      [ticket.key, noFormat],
      [ticket.fields.issuetype.name, noFormat],
      [ticket.fields.summary, noFormat],
      [ticket.column ?? "", noFormat],
      [ticket.fields.status.name, noFormat],
      [timeSinceLastTransition, noFormat],
      [ticket.fields.assignee.name, noFormat],
      [progressGauge, noFormat],
      [
        `${formatSecondsLikeJira(
          ticket.fields.aggregateprogress.progress ?? 0
        )}`,
        noFormat,
      ],
      [reasons.join(","), noFormat],
    ];
  });

  const calculatedWidths = data.reduce((previous, current) => {
    return current.map(([value], index) =>
      Math.max(stringLength(value) + 1, previous[index] ?? 0)
    );
  }, tableHeaderWidths);

  const renderRow = (
    row: ReadonlyArray<readonly [string, ReadonlyArray<clc.Format>]>
    // eslint-disable-next-line functional/no-return-void
  ): void => {
    const columns = row.reduce((line, [text], index) => {
      const columnWidth = calculatedWidths[index] ?? 0;
      return line.column(text, columnWidth);
    }, new CLUI.Line(outputBuffer));

    // eslint-disable-next-line functional/no-expression-statement
    columns.fill().store();
  };

  // eslint-disable-next-line functional/no-expression-statement
  renderRow(tableHeaders.map((header) => [header, [clc.cyan]]));

  // eslint-disable-next-line functional/no-expression-statement
  data.forEach(renderRow);

  // eslint-disable-next-line functional/no-expression-statement
  outputBuffer.output();
};

const search = async (jql: string): Promise<void> => {
  const countdown = new CLUI.Spinner("Searching the things...  ");
  // eslint-disable-next-line functional/no-expression-statement
  countdown.start();

  const tickets = await searchTickets(jql);

  // eslint-disable-next-line functional/no-expression-statement
  countdown.stop();

  // eslint-disable-next-line functional/no-expression-statement
  isLeft(tickets) ? console.error(tickets) : render(tickets.right);
};

export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "search",
    "searches for jira issues using JQL and then lints",
    (yargs) =>
      yargs
        .option("jql", {
          alias: "j",
          type: "string",
          describe: "jsql to search by",
        })
        .demandOption(["jql"]),
    (args) => {
      // eslint-disable-next-line functional/no-expression-statement
      void search(args.jql);
    }
  );

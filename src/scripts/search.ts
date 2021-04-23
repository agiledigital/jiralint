import { Argv } from "yargs";
import { RootCommand } from "..";
import { EnhancedIssue } from "../services/jira";
import { searchIssues, jiraApiClient } from "../services/jira_api";
import { issueActionRequired, IssueAction } from "../services/issue_checks";
import { isLeft } from "fp-ts/lib/Either";
import { readonlyDate } from "readonly-types/dist";
import {
  jiraFormattedDistance,
  jiraFormattedSeconds,
} from "../services/jira_date_fns";
import stringLength from "string-length";

import * as CLUI from "clui";
import * as clc from "cli-color";
// eslint-disable-next-line functional/no-expression-statement
require("cli-color");

const checkedIssues = (
  issues: ReadonlyArray<EnhancedIssue>
): ReadonlyArray<
  EnhancedIssue & {
    readonly action: IssueAction;
    readonly reasons: ReadonlyArray<string>;
  }
> => {
  // eslint-disable-next-line no-restricted-globals
  const now = readonlyDate(new Date());
  return issues.map((issue) => {
    const issueAction = issueActionRequired(issue, now);
    const reasons: readonly string[] = issueAction.checks.flatMap((check) =>
      check.outcome === "warn" || check.outcome === "fail" ? check.reasons : []
    );
    return {
      ...issue,
      action: issueAction,
      reasons,
    };
  });
};

// eslint-disable-next-line functional/no-return-void
const renderJson = (issues: ReadonlyArray<EnhancedIssue>): void => {
  // eslint-disable-next-line functional/no-expression-statement
  checkedIssues(issues).forEach((issue) =>
    console.log(JSON.stringify(issue, null, 2))
  );
};

// eslint-disable-next-line functional/no-return-void
const renderTable = (issues: ReadonlyArray<EnhancedIssue>): void => {
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
  > = checkedIssues(issues).map((issue) => {
    const originalEstimateSeconds =
      issue.fields.timetracking.originalEstimateSeconds ?? 0;
    const timeSpentSeconds = issue.fields.timetracking.timeSpentSeconds ?? 0;
    const timeRemainingSeconds =
      issue.fields.timetracking.remainingEstimateSeconds ?? 0;

    const progressGauge = CLUI.Gauge(
      timeSpentSeconds,
      originalEstimateSeconds + timeRemainingSeconds,
      10,
      originalEstimateSeconds,
      ""
    );

    const timeSinceLastTransition =
      issue.mostRecentTransition !== undefined
        ? jiraFormattedDistance(now, issue.mostRecentTransition.created)
        : "";

    const noFormat: ReadonlyArray<clc.Format> = [clc.white];

    return [
      [
        issue.action.actionRequired === "inspect"
          ? alarm[issue.reasons.length] ?? "E"
          : "",
        noFormat,
      ],
      [issue.key, noFormat],
      [issue.fields.issuetype.name, noFormat],
      [issue.fields.summary, noFormat],
      [issue.column ?? "", noFormat],
      [issue.fields.status.name, noFormat],
      [timeSinceLastTransition, noFormat],
      [issue.fields.assignee.name, noFormat],
      [progressGauge, noFormat],
      [
        `${jiraFormattedSeconds(issue.fields.aggregateprogress.progress ?? 0)}`,
        noFormat,
      ],
      [issue.reasons.join(","), noFormat],
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

const search = async (
  jql: string,
  accessToken: string,
  accessSecret: string,
  output: string
): Promise<void> => {
  const countdown = new CLUI.Spinner("Searching the things...  ");
  // eslint-disable-next-line functional/no-expression-statement
  countdown.start();

  const jiraClient = jiraApiClient(accessToken, accessSecret);

  const issues = await searchIssues(jql, jiraClient);

  // eslint-disable-next-line functional/no-expression-statement
  countdown.stop();

  const render = output === "table" ? renderTable : renderJson;

  // eslint-disable-next-line functional/no-expression-statement
  isLeft(issues) ? console.error(issues) : render(issues.right);
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
          describe: "jql to search by",
        })
        .option("output", {
          alias: "o",
          type: "string",
          choices: ["json", "table"],
          default: "table",
          description: "output format for results",
        })
        .option("accessToken", {
          alias: "t",
          type: "string",
          describe: "access token",
        })
        .option("accessSecret", {
          alias: "s",
          type: "string",
          describe: "access secret",
        })
        .group(["accessToken", "accessSecret"], "Auth")
        .demandOption(["jql", "accessToken", "accessSecret"]),
    (args) => {
      // eslint-disable-next-line functional/no-expression-statement
      void search(args.jql, args.accessToken, args.accessSecret, args.output);
    }
  );

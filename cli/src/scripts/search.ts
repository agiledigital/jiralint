import { Argv } from "yargs";
import { RootCommand, withAuthOptions } from "..";
import { EnhancedIssue, quality } from "@agiledigital-labs/jiralint-lib";
import {
  issueActionRequired,
  IssueAction,
} from "@agiledigital-labs/jiralint-lib";
import { isLeft } from "fp-ts/lib/Either";
import { readonlyDate } from "readonly-types/dist";
import {
  jiraFormattedDistance,
  jiraFormattedSeconds,
} from "@agiledigital-labs/jiralint-lib";
import stringLength from "string-length";
import { makeJiraClient, qaImpactStatementField, qualityField } from "./common";

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
    readonly issueQuality: string;
  }
> => {
  // eslint-disable-next-line no-restricted-globals
  const now = readonlyDate(new Date());
  return issues.map((issue) => {
    const issueAction = issueActionRequired(issue, now, qaImpactStatementField);

    const issueQuality = quality(issueAction);

    const reasons: readonly string[] = issueAction.checks.flatMap((check) =>
      check.outcome === "warn" || check.outcome === "fail" ? check.reasons : []
    );
    return {
      ...issue,
      action: issueAction,
      reasons,
      issueQuality,
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
    "Quality",
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

  // Simple visual representation of the degree of alarm a viewer should feel.
  // More whimsical emoji (e.g. 👀) raise some issues with rendering of wide
  // unicode characters.
  const alarm = ["⠀", "⠁", "⠉", "⠋", "⠛", "⣿"] as const;

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
    const quality = issue.fields[qualityField];

    return [
      [
        issue.action.actionRequired === "inspect"
          ? alarm[issue.reasons.length] ?? "E"
          : "",
        noFormat,
      ],
      [
        `${typeof quality === "string" ? quality : "-"}/${issue.issueQuality}`,
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
  jiraProtocol: string,
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string,
  jql: string,
  accessToken: string,
  accessSecret: string,
  output: OutputMode
): Promise<void> => {
  const countdown = new CLUI.Spinner("Searching the things...  ");
  // eslint-disable-next-line functional/no-expression-statement
  countdown.start();

  const jira = makeJiraClient(
    jiraProtocol,
    jiraHost,
    jiraConsumerKey,
    jiraConsumerSecret
  );

  const jiraApi = jira.jiraApi(accessToken, accessSecret);

  const issues = await jira.searchIssues(jql, jiraApi);

  // eslint-disable-next-line functional/no-expression-statement
  countdown.stop();

  const render = output === "table" ? renderTable : renderJson;

  // eslint-disable-next-line functional/no-expression-statement
  isLeft(issues) ? console.error(issues) : render(issues.right);
};

type OutputMode = "json" | "table";

const DEFAULT_OUTPUT_MODE: OutputMode = "table";

export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "search",
    "searches for jira issues using JQL and then lints",
    (yargs) =>
      withAuthOptions(yargs)
        .option("jql", {
          alias: "j",
          type: "string",
          describe: "jql to search by",
        })
        .option("output", {
          alias: "o",
          choices: ["json", "table"],
          default: DEFAULT_OUTPUT_MODE,
          description: "output format for results",
        })
        .demandOption(["jql"]),
    (args) => {
      // eslint-disable-next-line functional/no-expression-statement
      void search(
        args.jiraProtocol,
        args.jiraHost,
        args.jiraConsumerKey,
        args.jiraConsumerSecret,
        args.jql,
        args.accessToken,
        args.accessSecret,
        args.output
      );
    }
  );

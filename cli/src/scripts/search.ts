import { JiraClient } from "../../../lib/src/services/jira_api";
import { Argv } from "yargs";
import { RootCommand, withQualityFieldsOption } from "..";
import {
  EnhancedIssue,
  quality,
  issueActionRequired,
  IssueAction,
  jiraFormattedDistance,
  jiraFormattedSeconds,
  Check,
} from "@agiledigital/jiralint-lib";
import { isLeft } from "fp-ts/lib/Either";
import { readonlyDate, readonlyNow } from "readonly-types";
import stringLength from "string-length";

import * as CLUI from "clui";
import * as clc from "cli-color";

// eslint-disable-next-line functional/no-expression-statements
require("cli-color");

type CheckedIssue = EnhancedIssue & {
  readonly action: IssueAction;
  readonly reasons: readonly string[];
  readonly issueQuality: string;
};

const checkedIssues = (
  issues: readonly EnhancedIssue[]
): readonly CheckedIssue[] => {
  const now = readonlyDate(readonlyNow());

  // eslint-disable-next-line functional/prefer-immutable-types
  return issues.map((issue) => {
    const customChecks: readonly Check[] = [] as const; // TODO ability to dynamically load custom checks
    const issueAction = issueActionRequired(issue, now, customChecks);

    const issueQuality = quality(issueAction);

    // eslint-disable-next-line functional/prefer-immutable-types
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
const renderJson = (issues: readonly EnhancedIssue[]): void => {
  // eslint-disable-next-line functional/no-return-void
  checkedIssues(issues).forEach((issue) =>
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(issue, null, 2))
  );
};

const renderTable = (
  issues: readonly EnhancedIssue[],
  qualityFieldName: string
  // eslint-disable-next-line functional/no-return-void
): void => {
  // eslint-disable-next-line functional/no-expression-statements, no-console
  console.clear();

  const tableHeaders: readonly string[] = [
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
  // eslint-disable-next-line functional/prefer-immutable-types
  const alarm = ["⠀", "⠁", "⠉", "⠋", "⠛", "⣿"] as const;

  const tableHeaderWidths: readonly number[] = tableHeaders.map(
    (header) => stringLength(header) + 1
  );

  const outputBuffer: Readonly<CLUI.LineBuffer> = new CLUI.LineBuffer({
    x: 0,
    y: 0,
    width: "console",
    height: "console",
  });

  const now = readonlyDate(readonlyNow());

  const data: readonly (readonly (readonly [
    string,
    readonly clc.Format[]
    // eslint-disable-next-line functional/prefer-immutable-types
  ])[])[] = checkedIssues(issues).map((issue) => {
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

    const noFormat: readonly clc.Format[] = [clc.white];
    const quality = issue.fields[qualityFieldName];

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
      [issue.fields.assignee?.name ?? "", noFormat],
      [progressGauge, noFormat],
      [
        // eslint-disable-next-line spellcheck/spell-checker
        `${jiraFormattedSeconds(issue.fields.aggregateprogress.progress ?? 0)}`,
        noFormat,
      ],
      [issue.reasons.join(","), noFormat],
    ];
  });

  // eslint-disable-next-line functional/prefer-immutable-types
  const calculatedWidths = data.reduce((previous, current) => {
    // eslint-disable-next-line functional/prefer-immutable-types
    return current.map(([value], index) =>
      Math.max(stringLength(value) + 1, previous[index] ?? 0)
    );
  }, tableHeaderWidths);

  const renderRow = (
    row: readonly (readonly [string, readonly clc.Format[]])[]
    // eslint-disable-next-line functional/no-return-void
  ): void => {
    const initialValue: Readonly<CLUI.Line> = new CLUI.Line(outputBuffer);
    // eslint-disable-next-line functional/prefer-immutable-types
    const columns: Readonly<CLUI.Line> = row.reduce((line, [text], index) => {
      const columnWidth = calculatedWidths[index] ?? 0;
      return line.column(text, columnWidth);
    }, initialValue);

    // eslint-disable-next-line functional/no-expression-statements
    columns.fill().store();
  };

  // eslint-disable-next-line functional/no-expression-statements, functional/prefer-immutable-types
  renderRow(tableHeaders.map((header) => [header, [clc.cyan]]));

  // eslint-disable-next-line functional/no-expression-statements
  data.forEach(renderRow);

  // eslint-disable-next-line functional/no-expression-statements
  outputBuffer.output();
};

const search = async (
  jira: JiraClient,
  jql: string,
  output: OutputMode,
  boardNamesToIgnore: readonly string[],
  customFieldNames: readonly string[],
  qualityFieldName: string,
  qualityReasonFieldName: string
): Promise<void> => {
  const countdown: Readonly<CLUI.Spinner> = new CLUI.Spinner(
    "Searching the things...  "
  );
  // eslint-disable-next-line functional/no-expression-statements
  countdown.start();

  const issues = await jira.searchIssues(
    jql,
    boardNamesToIgnore,
    qualityFieldName,
    qualityReasonFieldName,
    customFieldNames,
    {}
  );

  // eslint-disable-next-line functional/no-expression-statements
  countdown.stop();

  const render = output === "table" ? renderTable : renderJson;

  isLeft(issues)
    ? console.error(issues)
    : render(issues.right, qualityFieldName);
};

type OutputMode = "json" | "table";

const DEFAULT_OUTPUT_MODE: OutputMode = "table";

// eslint-disable-next-line functional/prefer-immutable-types
export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "search",
    "searches for jira issues using JQL and then lints",
    // eslint-disable-next-line functional/prefer-immutable-types
    (yargs) =>
      withQualityFieldsOption(yargs)
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
        .option("boardNamesToIgnore", {
          type: "string",
          array: true,
          description:
            "Prefix of the name of boards to be ignored when determining the 'column' that a ticket is currently in.",
          default: [],
        })
        .option("customFieldNames", {
          type: "string",
          array: true,
          description:
            "List of other custom issue field names to include when retrieving issues from Jira.",
          default: [],
        })
        .demandOption(["jql"]),
    // eslint-disable-next-line functional/no-return-void, functional/prefer-immutable-types
    (args) => {
      // eslint-disable-next-line functional/no-expression-statements
      void search(
        args.jira,
        args.jql,
        args.output === "table" || args.output === "json"
          ? args.output
          : DEFAULT_OUTPUT_MODE,
        args.boardNamesToIgnore,
        args.customFieldNames,
        args.qualityFieldName,
        args.qualityReasonFieldName
      );
    }
  );

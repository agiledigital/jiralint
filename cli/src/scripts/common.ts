import { jiraClient } from "@agiledigital-labs/jiralint-lib";
import type { JiraClient } from "@agiledigital-labs/jiralint-lib";

// FIXME: solicit these options from the CLI user

const boardNamesToIgnore: readonly string[] = [
  "delivery management board",
  "copy of",
];

const accountField = "customfield_11410 ";

export const qualityField = "customfield_12410";

export const qaImpactStatementField = "customfield_10111";

export const makeJiraClient = (
  jiraProtocol: string,
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string
): JiraClient =>
  jiraClient(
    jiraProtocol,
    jiraHost,
    jiraConsumerKey,
    // We have to round-trip through base64 to work around a parsing bug in yargs.
    // It can't handle three or more dashes in an argument: --jiraConsumerSecret "---".
    // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
    Buffer.from(jiraConsumerSecret, "base64").toString("utf8"),
    boardNamesToIgnore,
    accountField,
    qualityField,
    qaImpactStatementField
  );

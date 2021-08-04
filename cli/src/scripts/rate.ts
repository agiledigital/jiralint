import { Argv } from "yargs";
import type { RootCommand } from "..";
import { jiraClient } from "@agiledigital-labs/jiralint-lib";
import * as config from "./config";

const rate = async (
  key: string,
  quality: string,
  accessToken: string,
  accessSecret: string
): Promise<void> => {
  const jira = jiraClient(
    config.jiraProtocol,
    config.jiraHost,
    config.jiraConsumerKey,
    config.privKey,
    config.boardNamesToIgnore,
    config.accountField,
    config.qualityField,
    config.qaImpactStatementField
  );

  const jiraApi = jira.jiraApi(accessToken, accessSecret);

  const update = await jira.updateIssueQuality(key, quality, jiraApi);

  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Updated [${JSON.stringify(update, null, 2)}]`);
};

export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "rate",
    "records the quality of a jira issue",
    (yargs) =>
      yargs
        .option("key", {
          alias: "k",
          type: "string",
          describe: "issue key",
        })
        .option("quality", {
          alias: "q",
          choices: ["A", "B"],
          description: "assessed quality",
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
        .demandOption(["key", "quality", "accessToken", "accessSecret"]),
    (args) => {
      // eslint-disable-next-line functional/no-expression-statement
      void rate(args.key, args.quality, args.accessToken, args.accessSecret);
    }
  );

import { Argv } from "yargs";
import { RootCommand } from "..";
import {
  updateIssueQuality,
  jiraApiClient,
} from "@agiledigital-labs/jiralint-lib";

const rate = async (
  key: string,
  quality: string,
  accessToken: string,
  accessSecret: string
): Promise<void> => {
  const jiraClient = jiraApiClient(accessToken, accessSecret);

  const update = await updateIssueQuality(key, quality, jiraClient);

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

import { Argv } from "yargs";
import { RootCommand, withAuthOptions } from "..";
import { makeJiraClient } from "./common";

const rate = async (
  jiraProtocol: string,
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string,
  key: string,
  quality: string,
  accessToken: string,
  accessSecret: string
): Promise<void> => {
  const jira = makeJiraClient(
    jiraProtocol,
    jiraHost,
    jiraConsumerKey,
    jiraConsumerSecret
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
      withAuthOptions(yargs)
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
        .demandOption(["key", "quality"]),
    (args) => {
      // eslint-disable-next-line functional/no-expression-statement
      void rate(
        args.jiraProtocol,
        args.jiraHost,
        args.jiraConsumerKey,
        args.jiraConsumerSecret,
        args.key,
        args.quality,
        args.accessToken,
        args.accessSecret
      );
    }
  );

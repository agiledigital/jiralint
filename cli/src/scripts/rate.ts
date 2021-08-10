import { Argv } from "yargs";
import { RootCommand, withQualityFieldsOption } from "..";
import { makeJiraClient } from "./common";

const rate = async (
  jiraProtocol: string,
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string,
  key: string,
  quality: string,
  reason: string,
  accessToken: string,
  accessSecret: string,
  qualityFieldName: string,
  reasonFieldName: string
): Promise<void> => {
  const jira = makeJiraClient(
    jiraProtocol,
    jiraHost,
    jiraConsumerKey,
    jiraConsumerSecret
  );

  const jiraApi = jira.jiraApi(accessToken, accessSecret);

  const update = await jira.updateIssueQuality(
    key,
    quality,
    reason,
    jiraApi,
    qualityFieldName,
    reasonFieldName
  );

  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Updated [${JSON.stringify(update, null, 2)}]`);
};

export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "rate",
    "records the quality of a jira issue",
    (yargs) =>
      withQualityFieldsOption(yargs)
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
        .option("reason", {
          alias: "r",
          type: "string",
          describe: "reason for assessment",
        })
        .demandOption(["key", "quality", "reason"]),
    (args) => {
      // eslint-disable-next-line functional/no-expression-statement
      void rate(
        args.jiraProtocol,
        args.jiraHost,
        args.jiraConsumerKey,
        args.jiraConsumerSecret,
        args.key,
        args.quality,
        args.reason,
        args.accessToken,
        args.accessSecret,
        args.qualityFieldName,
        args.qualityReasonFieldName
      );
    }
  );

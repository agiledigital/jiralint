// TODO Promote this to at least ReadonlyDeep
/* eslint functional/prefer-immutable-types: ["error", { "enforcement": "ReadonlyShallow" }] */

import { JiraClient } from "./../../../lib/src/services/jira_api";
import { Argv } from "yargs";
import { RootCommand, withQualityFieldsOption } from "..";

const rate = async (
  jira: JiraClient,
  key: string,
  quality: string,
  reason: string,
  qualityFieldName: string,
  reasonFieldName: string
): Promise<void> => {
  const update = await jira.updateIssueQuality(
    key,
    quality,
    reason,
    qualityFieldName,
    reasonFieldName
  );

  // eslint-disable-next-line no-console
  console.log(`Updated [${JSON.stringify(update, null, 2)}]`);
};

// eslint-disable-next-line functional/prefer-immutable-types
export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "rate",
    "records the quality of a jira issue",
    // eslint-disable-next-line functional/prefer-immutable-types
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
    // eslint-disable-next-line functional/no-return-void, functional/prefer-immutable-types
    (args) => {
      // eslint-disable-next-line functional/no-expression-statements
      void rate(
        args.jira,
        args.key,
        args.quality,
        args.reason,
        args.qualityFieldName,
        args.qualityReasonFieldName
      );
    }
  );

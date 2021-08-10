import yargs from "yargs";
import auth from "./scripts/auth";
import rate from "./scripts/rate";
import search from "./scripts/search";

/**
 * Dynamic type for global arguments. This needs to be its own as we use a
 * require below to import all the commands
 */
export type RootCommand = typeof rootCommand;

/**
 * Add global arguments here using the .option function.
 * E.g. const rootCommand = yargs.option('example', {type: 'string'});
 */
const rootCommand = yargs;

const authOptionGroup = "Auth";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withCommonOptions = <C extends RootCommand>(command: C) =>
  command
    .option("jiraProtocol", {
      alias: "p",
      type: "string",
      describe: "The Jira protocol",
      default: "https",
    })
    .option("jiraHost", {
      alias: "h",
      type: "string",
      describe: "The Jira host",
    })
    .option("jiraConsumerKey", {
      alias: "ck",
      type: "string",
      describe: "The Jira consumer key",
      default: "jiralintkey", // TODO remove this default?
    })
    .option("jiraConsumerSecret", {
      alias: "cs",
      type: "string",
      describe: "The Jira consumer secret in base64 format",
    })
    .group(["jiraConsumerKey", "jiraConsumerSecret"], authOptionGroup)
    .demandOption(["jiraHost", "jiraConsumerSecret"]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withAuthOptions = <C extends RootCommand>(command: C) =>
  withCommonOptions(command)
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
    .group(["accessToken", "accessSecret"], authOptionGroup)
    .demandOption(["accessToken", "accessSecret"]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withQualityFieldsOption = <C extends RootCommand>(command: C) =>
  withAuthOptions(command)
    .option("qualityFieldName", {
      type: "string",
      describe: "The name of the Jira custom field used to store issue quality",
    })
    .options("qualityReasonFieldName", {
      type: "string",
      describe:
        "The name of the Jira custom field used to store issue quality reason",
    })
    .demandOption(["qualityFieldName", "qualityReasonFieldName"]);

/* eslint-disable functional/no-expression-statement */
auth(rootCommand);
rate(rootCommand);
search(rootCommand);

rootCommand.demandCommand().strict().help().argv;
/* eslint-enable functional/no-expression-statement */

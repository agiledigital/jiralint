import {
  JiraClient,
  jiraClientWithOAuth,
  jiraClientWithPersonnelAccessToken,
  jiraClientWithUserCredentials,
} from "../../lib/src/services/jira_api";
import yargs from "yargs";
import auth from "./scripts/auth";
import rate from "./scripts/rate";
import search from "./scripts/search";
import { readFileSync } from "fs";
import { dirname, parse, join } from "path";

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

/**
 * Common parameters used by most jiralint requests
 */
type CliCommonConfig = {
  readonly jiraProtocol?: string;
  readonly jiraHost: string;
  readonly qualityFieldName: string;
  readonly qualityReasonFieldName: string;
};

type CliAuthPersonalAccessToken = {
  readonly personalAccessToken?: string;
};

type CliAuthOAuth = {
  readonly jiraConsumerKey?: string;
  readonly jiraConsumerSecret?: string;
  readonly accessToken?: string;
  readonly accessSecret?: string;
};

type CliAuthUserCredentials = {
  readonly username?: string;
  readonly password?: string;
};

type CliConfig = CliCommonConfig &
  CliAuthOAuth &
  CliAuthPersonalAccessToken &
  CliAuthUserCredentials;

const currentDirectory = process.cwd();
const rootPath = parse(currentDirectory).root;

const configIfExists = (dir: string): CliConfig | undefined => {
  // eslint-disable-next-line functional/no-try-statement
  try {
    const configPath = join(dir, ".jiralintrc");
    const configFile = readFileSync(configPath);
    // TODO - make this an io-ts codec
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return <CliConfig>JSON.parse(configFile.toString());
  } catch (_err: unknown) {
    return;
  }
};

const findConfig = (dir: string): CliConfig | undefined => {
  const config = configIfExists(dir);
  return config !== undefined
    ? config
    : dir === rootPath
    ? undefined
    : findConfig(dirname(dir));
};

/**
 * The config from the .jiralintrc config file
 */
const config: CliConfig | undefined = findConfig(process.cwd());

const jiraProtocolOptionKey = "jira.protocol";
const jiraHostOptionKey = "jira.host";
const jiraConsumerKeyOptionKey = "jira.consumerKey";
const jiraConsumerSecretOptionKey = "jira.consumerSecret";
const jiraAccessTokenOptionKey = "jira.accessToken";
const jiraAccessSecretOptionKey = "jira.accessSecret";
const jiraPersonalAccessTokenOptionKey = "jira.personalAccessToken";
const jiraUsernameOptionKey = "jira.username";
const jiraPasswordOptionKey = "jira.password";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withCommonOptions = <C extends RootCommand>(command: C) =>
  command
    .option(jiraProtocolOptionKey, {
      alias: "p",
      type: "string",
      describe: "The Jira protocol",
      default: config?.jiraProtocol ?? "https",
      choices: ["http", "https"],
    })
    .option(jiraHostOptionKey, {
      alias: "h",
      type: "string",
      describe: "The Jira host",
      default: config?.jiraHost,
    })
    .option(jiraConsumerKeyOptionKey, {
      alias: "ck",
      type: "string",
      describe: "The Jira consumer key",
      default: config?.jiraConsumerKey ?? "jiralintkey", // TODO remove this default?
    })
    .option(jiraConsumerSecretOptionKey, {
      alias: "cs",
      type: "string",
      describe: "The Jira consumer secret in base64 format",
      default: config?.jiraConsumerSecret,
    })
    .group([jiraHostOptionKey, jiraProtocolOptionKey], "Common Required:");

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withAuthenticationOptions = <C extends RootCommand>(command: C) =>
  withCommonOptions(command)
    .group([jiraConsumerKeyOptionKey, jiraConsumerSecretOptionKey], "Auth:")
    .demandOption([jiraHostOptionKey, jiraConsumerSecretOptionKey]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withAuthOptions = <C extends RootCommand>(command: C) =>
  withCommonOptions(command)
    .option(jiraAccessTokenOptionKey, {
      alias: "t",
      type: "string",
      describe: "access token",
      default: config?.accessToken,
    })
    .option(jiraAccessSecretOptionKey, {
      alias: "s",
      type: "string",
      describe: "access secret",
      default: config?.accessSecret,
    })
    .option(jiraUsernameOptionKey, {
      alias: "u",
      type: "string",
      describe: "your jira username",
      default: config?.username,
    })
    .option(jiraPasswordOptionKey, {
      alias: "z",
      type: "string",
      describe: "your jira password",
      default: config?.password,
    })
    .option(jiraPersonalAccessTokenOptionKey, {
      alias: "k",
      type: "string",
      describe: "your jira personal access token",
      default: config?.personalAccessToken,
    })
    .group(
      [
        jiraConsumerKeyOptionKey,
        jiraConsumerSecretOptionKey,
        jiraAccessTokenOptionKey,
        jiraAccessSecretOptionKey,
      ],
      "Connection - OAuth:"
    )
    .group(
      [jiraUsernameOptionKey, jiraPasswordOptionKey],
      "Connection - User Credentials:"
    )
    .group(
      [jiraPersonalAccessTokenOptionKey],
      "Connection - Personal Access Token:"
    )
    .option("jira", {
      describe: "Provide at least one full set of connection parameters",
    })
    .coerce(
      "jira",
      (jira: {
        readonly protocol?: "http" | "https";
        readonly host?: string;
        readonly consumerKey?: string;
        readonly consumerSecret?: string;
        readonly accessToken?: string;
        readonly accessSecret?: string;
        readonly personalAccessToken?: string;
        readonly username?: string;
        readonly password?: string;
      }): JiraClient => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (jira.protocol === undefined) {
          // eslint-disable-next-line functional/no-throw-statement
          throw new Error(
            "Please provide the [jira.protocol] for accessing Jira"
          );
        }
        // eslint-disable-next-line functional/no-conditional-statement
        if (jira.host === undefined) {
          // eslint-disable-next-line functional/no-throw-statement
          throw new Error("Please provide the [jira.host] for accessing Jira");
        }
        // If possible create a client using OAuth
        // eslint-disable-next-line functional/no-conditional-statement
        if (
          jira.consumerKey !== undefined &&
          jira.consumerSecret !== undefined &&
          jira.accessToken !== undefined &&
          jira.accessSecret !== undefined
        ) {
          return jiraClientWithOAuth(
            jira.protocol,
            jira.host,
            jira.consumerKey,
            // We have to round-trip through base64 to work around a parsing bug in yargs.
            // It can't handle three or more dashes in an argument: --jiraConsumerSecret "---".
            // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
            Buffer.from(jira.consumerSecret, "base64").toString("utf8"),
            jira.accessToken,
            jira.accessSecret
          );
        }
        // If OAuth is not possible, attempt to create a client using a personal access token
        // eslint-disable-next-line functional/no-conditional-statement
        if (jira.personalAccessToken !== undefined) {
          return jiraClientWithPersonnelAccessToken(
            jira.protocol,
            jira.host,
            jira.personalAccessToken
          );
        }
        // Only use username and password as a last resort
        // eslint-disable-next-line functional/no-conditional-statement
        if (jira.username !== undefined && jira.password !== undefined) {
          return jiraClientWithUserCredentials(
            jira.protocol,
            jira.host,
            jira.username,
            jira.password
          );
        }
        // eslint-disable-next-line functional/no-throw-statement
        throw new Error("Please provide a full set of Connection parameters");
      }
    )
    .demandOption("jira");

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withQualityFieldsOption = <C extends RootCommand>(command: C) =>
  withAuthOptions(command)
    .option("qualityFieldName", {
      type: "string",
      describe: "The name of the Jira custom field used to store issue quality",
      default: config?.qualityFieldName,
    })
    .options("qualityReasonFieldName", {
      type: "string",
      describe:
        "The name of the Jira custom field used to store issue quality reason",
      default: config?.qualityReasonFieldName,
    })
    .demandOption(["qualityFieldName", "qualityReasonFieldName"]);

/* eslint-disable functional/no-expression-statement */
auth(rootCommand);
rate(rootCommand);
search(rootCommand);

rootCommand.demandCommand().strict().help().argv;
/* eslint-enable functional/no-expression-statement */

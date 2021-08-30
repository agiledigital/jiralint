import { tryCatch, toUndefined } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
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

const tryOrUndefined = <T>(f: () => T): T | undefined =>
  pipe(tryCatch(f), toUndefined);

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
  // eslint-disable-next-line functional/functional-parameters
  return tryOrUndefined((): CliConfig => {
    const configPath = join(dir, ".jiralintrc");
    const configFile = readFileSync(configPath);
    // TODO - make this an io-ts codec
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return <CliConfig>JSON.parse(configFile.toString());
  });
};

const findConfig = (dir: string): CliConfig | undefined => {
  const config = configIfExists(dir);
  return config !== undefined
    ? config
    : dir === rootPath
    ? undefined
    : findConfig(dirname(dir));
};

const jiraProtocolOptionKey = "jira.protocol";
const jiraHostOptionKey = "jira.host";
const jiraConsumerKeyOptionKey = "jira.consumerKey";
const jiraConsumerSecretOptionKey = "jira.consumerSecret";
const jiraAccessTokenOptionKey = "jira.accessToken";
const jiraAccessSecretOptionKey = "jira.accessSecret";
const jiraPersonalAccessTokenOptionKey = "jira.personalAccessToken";
const jiraUsernameOptionKey = "jira.username";
const jiraPasswordOptionKey = "jira.password";

type JiraParameters = {
  readonly protocol?: "http" | "https";
  readonly host?: string;
  readonly consumerKey?: string;
  readonly consumerSecret?: string;
  readonly accessToken?: string;
  readonly accessSecret?: string;
  readonly personalAccessToken?: string;
  readonly username?: string;
  readonly password?: string;
};

type JiraClientBuilder = JiraParameters & {
  readonly missingParameters: ReadonlyArray<PropertyKey>;
  readonly client?: JiraClient;
};

/**
 * Returns the JiraClient builder object with a missing parameter if the
 * parameter was missing.
 *
 * @param prop the key to check for
 * @param builder the JiraClient builder
 * @returns the builder object, adding the missing parameter if necessary
 */
const hasMandatoryParameter =
  (prop: keyof JiraParameters) =>
  (builder: JiraClientBuilder): JiraClientBuilder =>
    builder[prop] === undefined
      ? { ...builder, missingParameters: [...builder.missingParameters, prop] }
      : builder;

/**
 * Guess how the user is trying to connect and let them know if they missed any
 * of the required parameters
 *
 * @param builder the JiraClient builder
 * @returns the builder object, with missing parameters added
 */
const addMissingParameters = (
  builder: JiraClientBuilder,
  parameters: ReadonlyArray<keyof JiraParameters>
): JiraClientBuilder => ({
  ...builder,
  missingParameters: [
    ...builder.missingParameters,
    ...parameters.filter((p: keyof JiraParameters) => builder[p] === undefined),
  ],
});

const hasConnectionParameters = (
  builder: JiraClientBuilder
): JiraClientBuilder =>
  builder.username !== undefined || builder.password !== undefined
    ? addMissingParameters(builder, ["username", "password"])
    : builder.personalAccessToken !== undefined
    ? builder
    : addMissingParameters(builder, [
        "consumerKey",
        "consumerSecret",
        "accessToken",
        "accessSecret",
      ]);

/**
 * If a client hasn't already been built and we have the user's OAuth
 * credentials, build a JiraClient with those credentials
 *
 * @param builder the JiraClient builder
 * @returns a builder which includes a client if it was built
 */
const makeOAuthClient = (builder: JiraClientBuilder): JiraClientBuilder =>
  builder.client === undefined &&
  builder.host !== undefined &&
  builder.protocol !== undefined &&
  builder.consumerKey !== undefined &&
  builder.consumerSecret !== undefined &&
  builder.accessToken !== undefined &&
  builder.accessSecret !== undefined
    ? {
        ...builder,
        client: jiraClientWithOAuth(
          builder.protocol,
          builder.host,
          builder.consumerKey,
          // We have to round-trip through base64 to work around a parsing bug in yargs.
          // It can't handle three or more dashes in an argument: --jiraConsumerSecret "---".
          // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
          Buffer.from(builder.consumerSecret, "base64").toString("utf8"),
          builder.accessToken,
          builder.accessSecret
        ),
      }
    : builder;

/**
 * If a client hasn't already been built and we have the user's personal access
 * token, build a JiraClient with those the access token
 *
 * @param builder the JiraClient builder
 * @returns a builder which includes a client if it was built
 */
const makePersonalAccessTokenClient = (
  builder: JiraClientBuilder
): JiraClientBuilder =>
  builder.client === undefined &&
  builder.host !== undefined &&
  builder.protocol !== undefined &&
  builder.personalAccessToken !== undefined
    ? {
        ...builder,
        client: jiraClientWithPersonnelAccessToken(
          builder.protocol,
          builder.host,
          builder.personalAccessToken
        ),
      }
    : builder;

/**
 * If a client hasn't already been built and we have the user credentials, build
 * a JiraClient with those user credentials.
 *
 * @param builder the JiraClient builder
 * @returns a builder which includes a client if it was built
 */
const makeUserCredentialsClient = (
  builder: JiraClientBuilder
): JiraClientBuilder =>
  builder.client === undefined &&
  builder.host !== undefined &&
  builder.protocol !== undefined &&
  builder.username !== undefined &&
  builder.password !== undefined
    ? {
        ...builder,
        client: jiraClientWithUserCredentials(
          builder.protocol,
          builder.host,
          builder.username,
          builder.password
        ),
      }
    : builder;

const jiraParamList = (params: ReadonlyArray<PropertyKey>): string =>
  params.map((p) => `  jira.${String(p)}`).join("\n");

/**
 * Verify a client exists and return it or throw an error with all of the
 * collected issues.
 *
 * @param builder the JiraClient builder
 * @returns a builder client if there is one or throws an error
 */
const verifyClient = (builder: JiraClientBuilder): JiraClient =>
  builder.client === undefined
    ? (() => {
        // we throw an error here as it's the only way to communicate these
        // errors with yargs at this point.
        // eslint-disable-next-line functional/no-throw-statement
        throw new Error(
          `Missing required argument${
            builder.missingParameters.length === 1 ? ":" : "s:\n"
          }${jiraParamList(builder.missingParameters)}`
        );
      })()
    : builder.client;

/**
 * The config from the .jiralintrc config file
 */
const config: CliConfig | undefined = findConfig(process.cwd());

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
      (jira: JiraParameters): JiraClient =>
        pipe(
          {
            ...jira,
            missingParameters: [],
          },
          hasMandatoryParameter("host"),
          hasMandatoryParameter("protocol"),
          hasConnectionParameters,
          makeOAuthClient,
          makePersonalAccessTokenClient,
          makeUserCredentialsClient,
          verifyClient
        )
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

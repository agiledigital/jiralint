import {
  getOAuthAccessToken,
  jiraClientWithOAuth,
} from "../../../lib/src/services/jira_api";
import { Argv } from "yargs";
import { RootCommand, withAuthenticationOptions } from "..";
import { isLeft } from "fp-ts/lib/Either";
import inquirer from "inquirer";

const auth = async (
  jiraProtocol: "http" | "https",
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string
): Promise<void> => {
  const { accessToken, accessSecret } = await getOAuthAccessToken(
    jiraProtocol,
    jiraHost,
    jiraConsumerKey,
    jiraConsumerSecret,
    async (requestUrl: string): Promise<string> => {
      const { secret } = await inquirer.prompt<{ readonly secret: string }>({
        type: "input",
        name: "secret",
        message: `Follow this link [${requestUrl}] then enter your access secret:`,
      });
      return secret;
    }
  );
  // eslint-disable-next-line no-console
  console.log(`Access token:  ${accessToken}`);
  // eslint-disable-next-line no-console
  console.log(`Access secret: ${accessSecret}`);

  const jiraClient = jiraClientWithOAuth(
    jiraProtocol,
    jiraHost,
    jiraConsumerKey,
    jiraConsumerSecret,
    accessToken,
    accessSecret
  );

  const user = await jiraClient.currentUser();

  isLeft(user)
    ? console.error(`Failed to get current user after auth [${user.left}]`)
    : console.info(JSON.stringify(user.right, null, 2));
};

export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "auth",
    // eslint-disable-next-line spellcheck/spell-checker
    "authorises the linter to call Jira APIs and outputs the access token and secret",
    (yargs) => withAuthenticationOptions(yargs),
    // eslint-disable-next-line functional/no-return-void
    (args) => {
      const protocol = args["jira.protocol"];
      // eslint-disable-next-line functional/no-expression-statements
      void auth(
        // yargs ensures that this is always 'http' or 'https'
        protocol === "http" || protocol === "https" ? protocol : "https",
        args["jira.host"],
        args["jira.consumerKey"],
        // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
        Buffer.from(args["jira.consumerSecret"], "base64").toString("utf8")
      );
    }
  );

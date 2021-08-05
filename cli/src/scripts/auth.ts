import { Argv } from "yargs";
import { RootCommand, withCommonOptions } from "..";
import { isLeft } from "fp-ts/lib/Either";
import inquirer from "inquirer";
import { makeJiraClient } from "./common";

// eslint-disable-next-line functional/functional-parameters
const auth = async (
  jiraProtocol: string,
  jiraHost: string,
  jiraConsumerKey: string,
  jiraConsumerSecret: string
): Promise<void> => {
  const jira = makeJiraClient(
    jiraProtocol,
    jiraHost,
    jiraConsumerKey,
    jiraConsumerSecret
  );

  const requested = await jira.startSignIn();

  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Request Token:        ${requested.requestSecret}`);
  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Request Token Secret: ${requested.requestToken}`);

  const answer = await inquirer.prompt<{ readonly secret: string }>({
    type: "input",
    name: "secret",
    message: `Follow this link [${requested.requestUrl}] then enter your access secret:`,
  });

  const authorised = await jira.getAccessToken(requested, answer.secret);

  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Access token:  ${authorised.accessToken}`);
  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Access secret: ${authorised.accessSecret}`);

  const jiraApi = jira.jiraApi(authorised.accessToken, authorised.accessSecret);

  const user = await jira.currentUser(jiraApi);

  // eslint-disable-next-line functional/no-expression-statement
  isLeft(user)
    ? console.error(`Failed to get current user after auth [${user.left}]`)
    : console.info(JSON.stringify(user.right, null, 2));
};

export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "auth",
    "authorises the linter to call Jira APIs and outputs the access token and secret",
    (yargs) => withCommonOptions(yargs),
    // eslint-disable-next-line functional/functional-parameters
    (args) => {
      // eslint-disable-next-line functional/no-expression-statement
      void auth(
        args.jiraProtocol,
        args.jiraHost,
        args.jiraConsumerKey,
        args.jiraConsumerSecret
      );
    }
  );

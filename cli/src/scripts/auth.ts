import { Argv } from "yargs";
import { RootCommand } from "..";
import {
  getAccessToken,
  currentUser,
  jiraApiClient,
  startSignIn,
} from "@agiledigital-labs/jiralint-lib";
import { isLeft } from "fp-ts/lib/Either";
import inquirer from "inquirer";

// eslint-disable-next-line functional/functional-parameters
const auth = async (): Promise<void> => {
  const requested = await startSignIn();

  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Request Token:        ${requested.requestSecret}`);
  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Request Token Secret: ${requested.requestToken}`);

  const answer = await inquirer.prompt<{ readonly secret: string }>({
    type: "input",
    name: "secret",
    message: `Follow this link [${requested.requestUrl}] then enter your access secret:`,
  });

  const authorised = await getAccessToken(requested, answer.secret);

  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Access token:  ${authorised.accessToken}`);
  // eslint-disable-next-line functional/no-expression-statement
  console.log(`Access secret: ${authorised.accessSecret}`);

  const jiraClient = jiraApiClient(
    authorised.accessToken,
    authorised.accessSecret
  );

  const user = await currentUser(jiraClient);

  // eslint-disable-next-line functional/no-expression-statement
  isLeft(user)
    ? console.error(`Failed to get current user after auth [${user.left}]`)
    : console.info(JSON.stringify(user.right, null, 2));
};

export default ({ command }: RootCommand): Argv<unknown> =>
  command(
    "auth",
    "authorises the linter to call Jira APIs and outputs the access token and secret",
    (yargs) => yargs,
    // eslint-disable-next-line functional/functional-parameters
    () => {
      // eslint-disable-next-line functional/no-expression-statement
      void auth();
    }
  );

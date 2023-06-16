import * as E from "fp-ts/lib/Either";
import JiraApi from "jira-client";
import { JiraClient, jiraClient } from "./jira_api";
import { boardReturn, searchJiraReturn } from "./test_data/jira_api_data";
import { readonlyDate } from "readonly-types";
import { pipe } from "fp-ts/lib/function";

jest.mock("jira-client", () => {
  return jest.fn().mockImplementation(() => {
    return {
      searchJira: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ issues: searchJiraReturn })
        ),
      getAllBoards: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ values: [{ id: 0, name: "0" }] })
        ),
      getConfiguration: jest
        .fn()
        .mockImplementation(() => Promise.resolve(boardReturn)),
      genericGet: jest.fn().mockImplementation((input: string) => {
        if (input.includes("comment")) return Promise.resolve({ comments: [] });
        else
          return input.includes("parent")
            ? Promise.resolve({ worklogs: [] })
            : Promise.resolve({
                worklogs: [
                  {
                    author: { name: "Jim" },
                    started: readonlyDate("2023-05-31T13:46:58.132+1000"),
                    timeSpentSeconds: 1,
                    comment: "I did a thing",
                  },
                ],
              });
      }),
    };
  });
});

describe("Searching issues", () => {
  const mockApi: Readonly<JiraApi> = new JiraApi({
    host: "host.atlassian.net",
  });

  const client: JiraClient = jiraClient("https", "host.atlassian.net", mockApi);

  it("should account for worklogs of subtasks in the parent", async () => {
    const response = await client.searchIssues("", [], "", "", [], {});

    pipe(
      response,
      E.map((issues) => {
        issues.forEach((issue) => {
          if (issue.key.includes("parent"))
            // As the worklog is not defined in the mocked JQL search call
            // nor are they defined in the mocked worklog API call for the parent
            // the only way this can be defined is if the worklogs
            // of the subtask is taken into account when you call search issues.
            // eslint-disable-next-line jest/no-conditional-expect
            expect(issue.mostRecentWorklog).toBeDefined();
        });
      }),
      E.mapLeft((error) => {
        console.error(error);
        expect(false).toBeTruthy();
      })
    );
  });
});

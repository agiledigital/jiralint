import * as E from "fp-ts/lib/Either";
import JiraApi from "jira-client";
import { JiraClient, jiraClient } from "./jira_api";
import { boardReturn, searchJiraReturn } from "./test_data/jira_api_data";
import { readonlyDate } from "readonly-types";
import { pipe } from "fp-ts/lib/function";

jest.mock("jira-client", () => {
  return jest.fn().mockImplementation(() => {
    return {
      searchJira: jest.fn().mockResolvedValue({ issues: searchJiraReturn }),
      getAllBoards: jest
        .fn()
        .mockResolvedValue({ values: [{ id: 0, name: "0" }] }),
      getConfiguration: jest.fn().mockResolvedValue(boardReturn),
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
      E.map((list) =>
        list.forEach((issue) => expect(issue.mostRecentWorklog).toBeDefined())
      )
    );

    expect.assertions(2);
  });
});

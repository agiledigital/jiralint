import * as E from "fp-ts/lib/Either";
import JiraApi from "jira-client";
import { JiraClient, jiraClient } from "./jira_api";
import { boardReturn, searchJiraReturn } from "./test_data/jira_api_data";
import { readonlyDate } from "readonly-types";
import { pipe } from "fp-ts/lib/function";
import { IssueWorklog } from "./jira";

const worklog: IssueWorklog = {
  author: { name: "Jim" },
  started: readonlyDate("2023-05-31T13:46:58.132+1000"),
  timeSpentSeconds: 1,
  comment: "I did a thing",
};

jest.mock("jira-client", () => {
  return jest.fn().mockImplementation(() => {
    return {
      searchJira: jest.fn().mockResolvedValue({ issues: searchJiraReturn }),
      getAllBoards: jest
        .fn()
        .mockResolvedValue({ values: [{ id: 0, name: "0" }] }),
      getConfiguration: jest.fn().mockResolvedValue(boardReturn),
      genericGet: jest
        .fn()
        .mockResolvedValueOnce({ comments: [] })
        .mockResolvedValueOnce({ comments: [] })
        .mockResolvedValueOnce({
          worklogs: [worklog],
        })
        .mockResolvedValueOnce({ worklogs: [] })
        .mockResolvedValueOnce({
          worklogs: [worklog],
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

    const worklogsFromPipe = pipe(
      response,
      E.map((list) => list.flatMap((issue) => issue.mostRecentWorklog))
    );

    expect(E.isRight(worklogsFromPipe)).toBeTruthy();

    // We know that worklogsFromPipe is right from the above but a conditional
    // is required to compile
    const worklogs: unknown[] = E.isRight(worklogsFromPipe)
      ? worklogsFromPipe.right
      : [];

    // We should expect that both the parent and subtask's most recent
    // work log are 'worklog' due to the fact that the worklog in subtasks
    // should be accounted for when calculating the most recent worklog for
    // a given task.
    worklogs.forEach((log) => expect(log).toStrictEqual(worklog));

    expect.assertions(3);
  });
});

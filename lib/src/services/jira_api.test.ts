import * as E from "fp-ts/lib/Either";
import JiraApi from "jira-client";
import { JiraClient, jiraClient } from "./jira_api";
import { boardReturn, issuesWithSubtask } from "./test_data/jira_api_data";
import { readonlyDate } from "readonly-types";
import { EnhancedIssue, IssueWorklog } from "./jira";

const worklog: IssueWorklog = {
  author: { name: "Jim" },
  started: readonlyDate("2023-05-30T13:46:58.132+1000"),
  timeSpentSeconds: 1,
  comment: "I did a thing",
};

const worklogNew: IssueWorklog = {
  author: { name: "Mary" },
  started: readonlyDate("2023-05-31T13:46:58.132+1000"),
  timeSpentSeconds: 1,
  comment: "I did a thing but later",
};

// eslint-disable-next-line functional/no-let
let testNumber = 0;

const determineTestCase = (input: string) => {
  switch (testNumber) {
    case 0:
      return { worklogs: [] };
    case 1:
      return input.includes("parent")
        ? { worklogs: [] }
        : { worklogs: [worklog] };
    case 2:
      return input.includes("parent")
        ? { worklogs: [worklog] }
        : { worklogs: [] };
    case 3:
      return input.includes("parent")
        ? { worklogs: [worklog] }
        : { worklogs: [worklogNew] };
    case 4:
      return input.includes("parent")
        ? { worklogs: [worklogNew] }
        : { worklogs: [worklog] };
    default:
      return {};
  }
};

jest.mock("jira-client", () => {
  return jest.fn().mockImplementation(() => {
    return {
      searchJira: jest.fn().mockResolvedValue({ issues: issuesWithSubtask }),
      getAllBoards: jest
        .fn()
        .mockResolvedValue({ values: [{ id: 0, name: "0" }] }),
      getConfiguration: jest.fn().mockResolvedValue(boardReturn),
      genericGet: jest.fn().mockImplementation((input: string) => {
        const response = input.includes("comment")
          ? { comments: [] }
          : determineTestCase(input);
        return Promise.resolve(response);
      }),
    };
  });
});

describe("Calculating the mostRecentWorklog", () => {
  const mockApi: Readonly<JiraApi> = new JiraApi({
    host: "host.atlassian.net",
  });

  const client: JiraClient = jiraClient("https", "host.atlassian.net", mockApi);

  it("should return undefined when the task has no worklog and subtask has no worklog", async () => {
    testNumber = 0;

    const response = await client.searchIssues("", [], "", "", [], {});

    const issues: readonly EnhancedIssue[] = E.isRight(response)
      ? response.right
      : [];

    // eslint-disable-next-line sonarjs/no-duplicate-string
    const parent = issues.find((issue) => issue.key === "parent key");
    expect(parent).toBeDefined();
    expect(parent?.mostRecentWorklog).toBeUndefined();
  });

  it("should return the subtasks worklog when the task has no worklog and subtask has a worklog", async () => {
    testNumber = 1;

    const response = await client.searchIssues("", [], "", "", [], {});

    const issues: readonly EnhancedIssue[] = E.isRight(response)
      ? response.right
      : [];

    const parent = issues.find((issue) => issue.key === "parent key");
    expect(parent).toBeDefined();
    expect(parent?.mostRecentWorklog).toStrictEqual(worklog);
  });

  it("should return the tasks worklog when the task has a worklog and subtask has no worklog", async () => {
    testNumber = 2;

    const response = await client.searchIssues("", [], "", "", [], {});

    const issues: readonly EnhancedIssue[] = E.isRight(response)
      ? response.right
      : [];

    const parent = issues.find((issue) => issue.key === "parent key");
    expect(parent).toBeDefined();
    expect(parent?.mostRecentWorklog).toStrictEqual(worklog);
  });

  it("should return the subtasks worklog when the task has a worklog and subtask has a newer worklog", async () => {
    testNumber = 3;

    const response = await client.searchIssues("", [], "", "", [], {});

    const issues: readonly EnhancedIssue[] = E.isRight(response)
      ? response.right
      : [];

    const parent = issues.find((issue) => issue.key === "parent key");
    expect(parent).toBeDefined();
    expect(parent?.mostRecentWorklog).toStrictEqual(worklogNew);
  });

  it("should return the tasks worklog when the task has a worklog and subtask has a older worklog", async () => {
    testNumber = 4;

    const response = await client.searchIssues("", [], "", "", [], {});

    const issues: readonly EnhancedIssue[] = E.isRight(response)
      ? response.right
      : [];

    const parent = issues.find((issue) => issue.key === "parent key");
    expect(parent).toBeDefined();
    expect(parent?.mostRecentWorklog).toStrictEqual(worklogNew);
  });
});

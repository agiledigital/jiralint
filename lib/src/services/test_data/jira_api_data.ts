import { readonlyDate } from "readonly-types";
import { Board, CloudIssue } from "../jira";

export const boardReturn: Board = {
  id: 0,
  name: "0",
  type: "a really cool one",
  columnConfig: {
    columns: [
      {
        name: "backlog",
        statuses: [
          {
            id: "0",
          },
        ],
      },
    ],
    constraintType: "very constrained",
  },
};

export const searchJiraReturn: CloudIssue[] = [
  {
    key: "parent key",
    self: "parent url atlassian",
    fields: {
      summary: "parent issue summary",
      description: "description",
      created: readonlyDate("2023-05-31T13:46:58.132+1000"),
      project: {
        key: "projectKey",
      },
      assignee: {
        displayName: "a really cool dude",
      },
      timetracking: {
        originalEstimateSeconds: 0,
        timeSpentSeconds: 0,
        remainingEstimateSeconds: 0,
        originalEstimate: "0d",
        timeSpent: "0d",
      },
      fixVersions: [],
      // eslint-disable-next-line spellcheck/spell-checker
      aggregateprogress: {
        progress: 120,
        total: 120,
        percent: 100,
      },
      issuetype: {
        name: "issue type",
        subtask: false,
      },
      status: {
        id: "0",
        name: "backlog",
        statusCategory: {
          id: 0,
          name: "Backlog",
          colorName: "yellow",
        },
      },
      comment: undefined,
      worklog: undefined,
      duedate: undefined,
      subtasks: [
        {
          id: "subtask id",
          key: "subtask key",
        },
      ],
      // eslint-disable-next-line spellcheck/spell-checker
      aggregatetimeestimate: 0,
      aggregatetimeoriginalestimate: 0,
      aggregatetimespent: 0,
      parent: {
        id: "",
        key: "",
      },
    },
    changelog: {
      histories: [],
    },
  },
  {
    key: "subtask key",
    self: "subtask url atlassian",
    fields: {
      summary: "subtask issue summary",
      description: "description",
      created: readonlyDate("2023-05-31T13:46:58.132+1000"),
      project: {
        key: "projectKey",
      },
      assignee: {
        displayName: "a really cool dude",
      },
      timetracking: {
        originalEstimateSeconds: 0,
        timeSpentSeconds: 0,
        remainingEstimateSeconds: 0,
        originalEstimate: "0d",
        timeSpent: "0d",
      },
      fixVersions: [],
      // eslint-disable-next-line spellcheck/spell-checker
      aggregateprogress: {
        progress: 120,
        total: 120,
        percent: 100,
      },
      issuetype: {
        name: "issue type",
        subtask: true,
      },
      status: {
        id: "0",
        name: "backlog",
        statusCategory: {
          id: 0,
          name: "Backlog",
          colorName: "yellow",
        },
      },
      comment: undefined,
      worklog: undefined,
      duedate: undefined,
      subtasks: [],
      // eslint-disable-next-line spellcheck/spell-checker
      aggregatetimeestimate: 0,
      aggregatetimeoriginalestimate: 0,
      aggregatetimespent: 0,
      parent: {
        id: "",
        key: "",
      },
    },
    changelog: {
      histories: [],
    },
  },
];

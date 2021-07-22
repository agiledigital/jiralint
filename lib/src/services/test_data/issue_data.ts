import { EnhancedIssue, Issue } from "../jira";
import { readonlyDate } from "readonly-types";

export const issue: Issue = {
  key: "ABC-123",
  self: "self",
  fields: {
    summary: "summary",
    description: "description",
    created: readonlyDate("2020-01-01"),
    project: {
      key: "project",
    },
    timetracking: {},
    fixVersions: [],
    aggregateprogress: {
      progress: undefined,
      total: undefined,
      percent: undefined,
    },
    issuetype: {
      name: "issue name",
      subtask: false,
    },
    assignee: {
      name: "assignee",
    },
    status: {
      id: "id",
      name: "status",
      statusCategory: {
        id: undefined,
        name: undefined,
        colorName: undefined,
      },
    },
    comment: {
      comments: [],
      maxResults: 0,
      total: 0,
      startAt: 0,
    },
    duedate: undefined,
    worklog: {
      worklogs: [],
      maxResults: 0,
      total: 0,
      startAt: 0,
    },
  },
  changelog: {
    histories: [],
  },
};

export const enhancedIssue: EnhancedIssue = {
  ...issue,
  inProgress: true,
  stalled: false,
  closed: false,
  released: false,
  viewLink: "viewlink",
  lastWorked: undefined,
};
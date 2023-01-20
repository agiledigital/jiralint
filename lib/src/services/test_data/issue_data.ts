import type { EnhancedIssue, GenericJiraIssue, IssueWorklog } from "../jira";
import { readonlyDate } from "readonly-types";

export const issue: GenericJiraIssue = {
  key: "ABC-123",
  self: "self",
  fields: {
    summary: "summary",
    description: "description",
    created: readonlyDate("2020-01-01"),
    project: {
      key: "project",
    },
    // hierarchyLevel:0,
    timetracking: {},
    fixVersions: [],
    // eslint-disable-next-line spellcheck/spell-checker
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
    // eslint-disable-next-line spellcheck/spell-checker
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
  // eslint-disable-next-line spellcheck/spell-checker
  viewLink: "viewlink",
  lastWorked: undefined,
  quality: "A",
  qualityReason: "for a good reason",
};

export const worklog: IssueWorklog = {
  author: {
    // eslint-disable-next-line spellcheck/spell-checker
    name: "danixon",
  },
  comment: "Working on issue ESGT-13",
  started: readonlyDate("2021-08-16T14:00:00.000Z"),
  timeSpentSeconds: 10800,
};

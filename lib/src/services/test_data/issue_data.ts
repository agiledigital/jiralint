/* eslint-disable functional/prefer-immutable-types */
/* eslint-disable spellcheck/spell-checker */
import type { EnhancedIssue, Issue, IssueWorklog } from "../jira";
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
    subtasks: [],
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
  waitingForReview: false,
  closed: false,
  released: false,
  viewLink: "viewlink",
  lastWorked: undefined,
  quality: "A",
  qualityReason: "for a good reason",
  description: "description",
};

export const worklog: IssueWorklog = {
  author: {
    name: "danixon",
  },
  comment: "Working on issue ESGT-13",
  started: readonlyDate("2021-08-16T14:00:00.000Z"),
  timeSpentSeconds: 10800,
};

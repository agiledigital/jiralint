/* eslint-disable spellcheck/spell-checker */
import type { EnhancedIssue, Issue, IssueWorklog } from "../jira";
import { readonlyDate } from "readonly-types";

const baseFields = {
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
};

export const issue: Issue = {
  key: "ABC-123",
  self: "self",
  fields: {
    ...baseFields,
    issuetype: {
      name: "issue name",
      subtask: false,
    },
    subtasks: [
      {
        id: "ABC-124 id",
        key: "ABC-124",
      },
    ],
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

export const Subtask: Issue = {
  key: "ABC-124",
  self: "self",
  fields: {
    ...baseFields,
    issuetype: {
      name: "issue name",
      subtask: true,
    },
    subtasks: [],
  },
  changelog: {
    histories: [],
  },
};

export const enhancedSubtask: EnhancedIssue = {
  ...Subtask,
  inProgress: true,
  stalled: false,
  waitingForReview: false,
  closed: false,
  released: false,
  viewLink: "viewlink",
  lastWorked: undefined,
  quality: "A+++",
  qualityReason: "for a great reason",
  description: "description",
};

/* eslint-disable sonarjs/no-duplicate-string */
export const nullDescription = {
  expand:
    "operations,versionedRepresentations,editmeta,changelog,renderedFields",
  id: "39477",
  self: "https://jira.example.com/rest/api/2/issue/39477",
  key: "ABC-100",
  fields: {
    summary: "QA and Rework",
    issuetype: {
      self: "https://jira.example.com/rest/api/2/issuetype/5",
      id: "5",
      description: "The sub-task of the issue",
      iconUrl:
        "https://jira.example.com/secure/viewavatar?size=xsmall&avatarId=11606&avatarType=issuetype",
      name: "Sub-task",
      subtask: true,
      avatarId: 11606,
    },
    hierarchyLevel: 0,
    subtasks: [],
    created: "2014-09-08T12:50:57.000+1000",
    description: null,
    project: {
      self: "https://jira.example.com/rest/api/2/project/12080",
      id: "12080",
      key: "ABC",
      name: "Acme Inc Project",
      projectTypeKey: "software",
      simplified: false,
      avatarUrls: {
        "48x48":
          "https://jira.example.com/secure/projectavatar?pid=12080&avatarId=10011",
        "24x24":
          "https://jira.example.com/secure/projectavatar?size=small&pid=12080&avatarId=10011",
        "16x16":
          "https://jira.example.com/secure/projectavatar?size=xsmall&pid=12080&avatarId=10011",
        "32x32":
          "https://jira.example.com/secure/projectavatar?size=medium&pid=12080&avatarId=10011",
      },
      projectCategory: {
        self: "https://jira.example.com/rest/api/2/projectCategory/10011",
        id: "10011",
        description:
          "Projects that are now inactive, will be excluded from all reporting.",
        name: "9 inActive",
      },
    },
    fixVersions: [
      {
        self: "https://jira.example.com/rest/api/2/version/13589",
        id: "13589",
        name: "Kanban",
        archived: false,
        released: false,
      },
    ],
    aggregateprogress: {
      progress: 0,
      total: 25200,
      percent: 0,
    },
    aggregatetimespent: null,
    timetracking: {
      originalEstimate: "1d",
      remainingEstimate: "1d",
      originalEstimateSeconds: 25200,
      remainingEstimateSeconds: 25200,
    },
    aggregatetimeoriginalestimate: 25200,
    aggregatetimeestimate: 25200,
    comment: {
      comments: [],
      maxResults: 0,
      total: 0,
      startAt: 0,
    },
    assignee: {
      self: "https://jira.example.com/rest/api/2/user?username=sxguy",
      name: "sxguy",
      key: "sxguy",
      accountId: "557058:10f6981f-4b59-40ef-b049-28ee1acb3293",
      emailAddress: "sxguy@example.com",
      avatarUrls: {
        "48x48":
          "https://jira.example.com/secure/useravatar?ownerId=sxguy&avatarId=12390",
        "24x24":
          "https://jira.example.com/secure/useravatar?size=small&ownerId=sxguy&avatarId=12390",
        "16x16":
          "https://jira.example.com/secure/useravatar?size=xsmall&ownerId=sxguy&avatarId=12390",
        "32x32":
          "https://jira.example.com/secure/useravatar?size=medium&ownerId=sxguy&avatarId=12390",
      },
      displayName: "Some Guy",
      active: true,
      timeZone: "Australia/Sydney",
    },
    status: {
      self: "https://jira.example.com/rest/api/2/status/5",
      description:
        "A resolution has been taken, and it is awaiting verification by reporter. From here issues are either reopened, or are closed.",
      iconUrl: "https://jira.example.com/images/icons/statuses/resolved.png",
      name: "Resolved",
      id: "5",
      statusCategory: {
        self: "https://jira.example.com/rest/api/2/statuscategory/2",
        id: 2,
        key: "new",
        colorName: "blue-gray",
        name: "To Do",
      },
    },
  },
  changelog: {
    startAt: 0,
    maxResults: 5,
    total: 5,
    histories: [],
  },
};

export const regular = {
  expand:
    "operations,versionedRepresentations,editmeta,changelog,renderedFields",
  id: "39477",
  self: "https://jira.example.com/rest/api/2/issue/39477",
  key: "ABC-100",
  fields: {
    summary: "QA and Rework",
    issuetype: {
      self: "https://jira.example.com/rest/api/2/issuetype/5",
      id: "5",
      description: "The sub-task of the issue",
      iconUrl:
        "https://jira.example.com/secure/viewavatar?size=xsmall&avatarId=11606&avatarType=issuetype",
      name: "Sub-task",
      subtask: true,
      avatarId: 11606,
    },
    subtasks: [],
    created: "2014-09-08T12:50:57.000+1000",
    description: "some description",
    hierarchyLevel: 0,
    project: {
      simplified: false,
      self: "https://jira.example.com/rest/api/2/project/12080",
      id: "12080",
      key: "ABC",
      name: "Acme Inc Project",
      projectTypeKey: "software",
      avatarUrls: {
        "48x48":
          "https://jira.example.com/secure/projectavatar?pid=12080&avatarId=10011",
        "24x24":
          "https://jira.example.com/secure/projectavatar?size=small&pid=12080&avatarId=10011",
        "16x16":
          "https://jira.example.com/secure/projectavatar?size=xsmall&pid=12080&avatarId=10011",
        "32x32":
          "https://jira.example.com/secure/projectavatar?size=medium&pid=12080&avatarId=10011",
      },
      projectCategory: {
        self: "https://jira.example.com/rest/api/2/projectCategory/10011",
        id: "10011",
        description:
          "Projects that are now inactive, will be excluded from all reporting.",
        name: "9 inActive",
      },
    },
    fixVersions: [
      {
        self: "https://jira.example.com/rest/api/2/version/13589",
        id: "13589",
        name: "Kanban",
        archived: false,
        released: false,
      },
    ],
    aggregateprogress: {
      progress: 0,
      total: 25200,
      percent: 0,
    },
    aggregatetimespent: null,
    timetracking: {
      originalEstimate: "1d",
      remainingEstimate: "1d",
      originalEstimateSeconds: 25200,
      remainingEstimateSeconds: 25200,
    },
    aggregatetimeoriginalestimate: 25200,
    aggregatetimeestimate: 25200,
    comment: {
      comments: [],
      maxResults: 0,
      total: 0,
      startAt: 0,
    },
    assignee: {
      self: "https://jira.example.com/rest/api/2/user?username=sxguy",
      name: "sxguy",
      key: "sxguy",
      accountId: "557058:10f6981f-4b59-40ef-b049-28ee1acb3293",
      emailAddress: "sxguy@example.com",
      avatarUrls: {
        "48x48":
          "https://jira.example.com/secure/useravatar?ownerId=sxguy&avatarId=12390",
        "24x24":
          "https://jira.example.com/secure/useravatar?size=small&ownerId=sxguy&avatarId=12390",
        "16x16":
          "https://jira.example.com/secure/useravatar?size=xsmall&ownerId=sxguy&avatarId=12390",
        "32x32":
          "https://jira.example.com/secure/useravatar?size=medium&ownerId=sxguy&avatarId=12390",
      },
      displayName: "Some Guy",
      active: true,
      timeZone: "Australia/Sydney",
    },
    status: {
      self: "https://jira.example.com/rest/api/2/status/5",
      description:
        "A resolution has been taken, and it is awaiting verification by reporter. From here issues are either reopened, or are closed.",
      iconUrl: "https://jira.example.com/images/icons/statuses/resolved.png",
      name: "Resolved",
      id: "5",
      statusCategory: {
        self: "https://jira.example.com/rest/api/2/statuscategory/2",
        id: 2,
        key: "new",
        colorName: "blue-gray",
        name: "To Do",
      },
    },
  },
  changelog: {
    startAt: 0,
    maxResults: 5,
    total: 5,
    histories: [],
  },
};

export const withParent = {
  expand:
    "operations,versionedRepresentations,editmeta,changelog,renderedFields",
  id: "121666",
  self: "https://jira.example.com/rest/api/2/issue/121666",
  key: "ABC-433",
  fields: {
    summary: "Implement fetch /v1/shopping-cart API in backend.",
    hierarchyLevel: 0,
    issuetype: {
      self: "https://jira.example.com/rest/api/2/issuetype/5",
      id: "5",
      description: "The sub-task of the issue",
      iconUrl:
        "https://jira.example.com/secure/viewavatar?size=xsmall&avatarId=11606&avatarType=issuetype",
      name: "Sub-task",
      subtask: true,
      avatarId: 11606,
    },
    parent: {
      id: "121082",
      key: "ABC-398",
      self: "https://jira.example.com/rest/api/2/issue/121082",
      fields: {
        summary: "APIs are proxied.",
        hierarchyLevel: 0,
        status: {
          self: "https://jira.example.com/rest/api/2/status/3",
          description:
            "This issue is being actively worked on at the moment by the assignee.",
          iconUrl:
            "https://jira.example.com/images/icons/statuses/inprogress.png",
          name: "In Progress",
          id: "3",
          statusCategory: {
            self: "https://jira.example.com/rest/api/2/statuscategory/4",
            id: 4,
            key: "indeterminate",
            colorName: "yellow",
            name: "In Progress",
          },
        },
        priority: {
          self: "https://jira.example.com/rest/api/2/priority/8",
          iconUrl:
            "https://jira.example.com/images/icons/priorities/trivial.svg",
          name: "None",
          id: "8",
        },
        issuetype: {
          self: "https://jira.example.com/rest/api/2/issuetype/4",
          id: "4",
          description:
            "An improvement or enhancement to an existing feature or task.",
          iconUrl:
            "https://jira.example.com/secure/viewavatar?size=xsmall&avatarId=11600&avatarType=issuetype",
          name: "Improvement",
          subtask: false,
          avatarId: 11600,
        },
      },
    },
    subtasks: [],
    created: "2021-05-03T15:13:44.000+1000",
    description: null,
    project: {
      self: "https://jira.example.com/rest/api/2/project/12080",
      id: "12080",
      key: "ABC",
      name: "Acme Inc Project",
      projectTypeKey: "software",
      simplified: false,
      avatarUrls: {
        "48x48":
          "https://jira.example.com/secure/projectavatar?pid=12080&avatarId=10011",
        "24x24":
          "https://jira.example.com/secure/projectavatar?size=small&pid=12080&avatarId=10011",
        "16x16":
          "https://jira.example.com/secure/projectavatar?size=xsmall&pid=12080&avatarId=10011",
        "32x32":
          "https://jira.example.com/secure/projectavatar?size=medium&pid=12080&avatarId=10011",
      },
      projectCategory: {
        self: "https://jira.example.com/rest/api/2/projectCategory/10011",
        id: "10011",
        description:
          "Projects that are now inactive, will be excluded from all reporting.",
        name: "9 inActive",
      },
    },
    fixVersions: [],
    aggregateprogress: { progress: 17700, total: 17700, percent: 100 },
    aggregatetimespent: 17700,
    timetracking: {
      originalEstimate: "4h",
      remainingEstimate: "0m",
      timeSpent: "4h 55m",
      originalEstimateSeconds: 14400,
      remainingEstimateSeconds: 0,
      timeSpentSeconds: 17700,
    },
    aggregatetimeoriginalestimate: 14400,
    aggregatetimeestimate: 0,
    comment: { comments: [], maxResults: 0, total: 0, startAt: 0 },
    assignee: {
      self: "https://jira.example.com/rest/api/2/user?username=sxguy",
      accountId: "557058:10f6981f-4b59-40ef-b049-28ee1acb3293",
      name: "sxguy",
      key: "sxguy",
      emailAddress: "sxguy@example.com",
      avatarUrls: {
        "48x48":
          "https://jira.example.com/secure/useravatar?ownerId=sxguy&avatarId=12391",
        "24x24":
          "https://jira.example.com/secure/useravatar?size=small&ownerId=sxguy&avatarId=12391",
        "16x16":
          "https://jira.example.com/secure/useravatar?size=xsmall&ownerId=sxguy&avatarId=12391",
        "32x32":
          "https://jira.example.com/secure/useravatar?size=medium&ownerId=sxguy&avatarId=12391",
      },
      displayName: "Some Guy",
      active: true,
      timeZone: "Australia/Sydney",
    },
    status: {
      self: "https://jira.example.com/rest/api/2/status/5",
      description:
        "A resolution has been taken, and it is awaiting verification by reporter. From here issues are either reopened, or are closed.",
      iconUrl: "https://jira.example.com/images/icons/statuses/resolved.png",
      name: "Resolved",
      id: "5",
      statusCategory: {
        self: "https://jira.example.com/rest/api/2/statuscategory/2",
        id: 2,
        key: "new",
        colorName: "blue-gray",
        name: "To Do",
      },
    },
  },
  changelog: {
    startAt: 0,
    maxResults: 7,
    total: 7,
    histories: [
      {
        id: "555096",
        author: {
          self: "https://jira.example.com/rest/api/2/user?username=sxguy",
          name: "sxguy",
          key: "sxguy",
          emailAddress: "sxguy@example.com",
          avatarUrls: {
            "48x48":
              "https://jira.example.com/secure/useravatar?ownerId=sxguy&avatarId=12391",
            "24x24":
              "https://jira.example.com/secure/useravatar?size=small&ownerId=sxguy&avatarId=12391",
            "16x16":
              "https://jira.example.com/secure/useravatar?size=xsmall&ownerId=sxguy&avatarId=12391",
            "32x32":
              "https://jira.example.com/secure/useravatar?size=medium&ownerId=sxguy&avatarId=12391",
          },
          displayName: "Some Guy",
          active: true,
          timeZone: "Australia/Sydney",
        },
        created: "2021-05-12T15:27:34.654+1000",
        items: [
          {
            field: "status",
            fieldtype: "jira",
            from: "1",
            fromString: "Open",
            to: "3",
            toString: "In Progress",
          },
        ],
      },
    ],
  },
};

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: 2018,
    sourceType: "module",
  },
  extends: ["typed-fp", "agile-digital"],
  env: {
    "jest/globals": true,
    es6: true,
  },
  plugins: [
    "jest",
    "sonarjs",
    "functional",
    "@typescript-eslint",
    "prettier",
    "total-functions",
  ],
  rules: {
    "functional/no-return-void": "warn",
    // https://github.com/aotaduy/eslint-plugin-spellcheck
    "spellcheck/spell-checker": [
      "warn",
      {
        skipWords: [
          "Argv",
          "Authorised",
          "assignee",
          "changelog",
          "changelogs",
          "clc",
          "codec",
          "Codec",
          "duedate",
          "danixon",
          "fc",
          "fieldtype",
          "globals",
          "io",
          "issuetype",
          "jira",
          "Jira",
          "jiralint",
          "jiralintrc",
          "jql",
          "Kanban",
          "Nullable",
          "oauth",
          "proxied",
          "Readonly",
          "readonly",
          "rollup",
          "servlet",
          "sonarjs",
          "subtask",
          "subtasks",
          "timetracking",
          "unicode",
          "utf8",
          "Urls",
          "versioned",
          "viewlink",
          "worklog",
          "Worklog",
          "worklogs",
          "yargs",
        ],
      },
    ],
  },
  settings: {
    jest: {
      version: 28,
    },
  },
};
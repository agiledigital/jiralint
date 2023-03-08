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
    "functional/prefer-immutable-types": ["error", { "enforcement": "Immutable" }],
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
  overrides: [
    {
      "files": ["*.test.ts"],
      "rules": {
        "functional/no-return-void": "off",
        "functional/functional-parameters": "off",
        "functional/no-expression-statements": "off",
        "functional/no-throw-statements": "off",
        "functional/no-conditional-statements": "off",
        "functional/prefer-immutable-types": ["error", { "enforcement": "ReadonlyDeep" }],
      },
    },
  ],
  settings: {
    jest: {
      version: 28,
    },
    "immutability": {
      "overrides": [
        // https://github.com/RebeccaStevens/is-immutable-type#default-overrides
        // Note: When providing custom overrides, the default ones will not be used.
        // Be sure to include the default overrides in your custom overrides if you
        // don't want to lose them. You can obtain them with getDefaultOverrides().
        { name: "Map", to: "Mutable" },
        { name: "Set", to: "Mutable" },
        { name: "Date", to: "Mutable" },
        { name: "URL", to: "Mutable" },
        { name: "URLSearchParams", to: "Mutable" },
        {
          name: "ReadonlyArray",
          to: "Immutable",
          from: "ReadonlyDeep",
        },
        {
          // From fp-ts
          // export interface JsonArray extends ReadonlyArray<Json> {}
          name: "JsonArray",
          to: "Immutable",
        },
        {
          // From fp-ts
          // export declare type Json = boolean | number | string | null | JsonArray | JsonRecord
          name: "Json",
          to: "Immutable",
        },
        {
          // From io-ts
          // export interface Errors extends Array<ValidationError> {}
          name: "Errors",
          to: "Immutable", // Not actually true, we should raise a PR against io-ts to make Errors use a readonly array
          from: "Mutable",
        },
        {
          // From io-ts
          // A readonly codec. Not the type of the value represented by the codec. The type of the codec itself.
          // I.e., the result of calling `T.readonly(...)`.
          name: "ReadonlyC",
          to: "Immutable", // Not actually true, we should raise a PR against io-ts to make ReadonlyC truly immutable
          from: "Mutable",
        },
        {
          // TODO work out why this is being detected wrong
          name: "ReadonlyDate",
          to: "Immutable",
        },
        {
          name: "ReadonlyNonEmptyArray",
          to: "Immutable",
        },
        {
          name: "Promise",
          to: "Immutable",
          from: "ReadonlyDeep", // Sigh
        },
      ]
    }
  },
};

import { IssueAction } from "./issue_checks";
import { quality } from "./issue_quality";

const allGood: IssueAction = {
  actionRequired: "none",
  checks: [
    {
      outcome: "ok",
      reasons: ["all ok"],
      description: "",
    },
  ],
};

const prettyGood: IssueAction = {
  actionRequired: "none",
  checks: [
    {
      outcome: "ok",
      reasons: ["all ok"],
      description: "",
    },
    {
      outcome: "warn",
      reasons: ["slightly amiss"],
      description: "",
    },
  ],
};

const bad: IssueAction = {
  actionRequired: "none",
  checks: [
    {
      outcome: "ok",
      reasons: ["all ok"],
      description: "",
    },
    {
      outcome: "fail",
      reasons: ["uh oh"],
      description: "",
    },
  ],
};

const worrisome: IssueAction = {
  actionRequired: "none",
  checks: [
    {
      outcome: "ok",
      reasons: ["all ok"],
      description: "",
    },
    {
      outcome: "fail",
      reasons: ["uh oh"],
      description: "",
    },
    {
      outcome: "fail",
      reasons: ["uh oh"],
      description: "",
    },
  ],
};

const reallyBad: IssueAction = {
  actionRequired: "none",
  checks: [
    {
      outcome: "ok",
      reasons: ["all ok"],
      description: "",
    },
    {
      outcome: "fail",
      reasons: ["uh oh"],
      description: "",
    },
    {
      outcome: "fail",
      reasons: ["uh oh"],
      description: "",
    },
    {
      outcome: "fail",
      reasons: ["uh oh"],
      description: "",
    },
  ],
};

describe("issue quality", () => {
  it.each([
    [allGood, "A+"],
    [prettyGood, "A"],
    [bad, "B"],
    [worrisome, "C"],
    [reallyBad, "F"],
  ])("should be assessed as expected", (action, expected) => {
    const actual = quality(action);

    expect(actual).toEqual(expected);
  });
});

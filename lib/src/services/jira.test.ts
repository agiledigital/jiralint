/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statement */
import { Issue } from "./jira";
import { PathReporter } from "io-ts/PathReporter";
import * as E from "fp-ts/lib/Either";
import { isLeft } from "fp-ts/lib/These";

import * as TestData from "./test_data/jira_data";

describe("decoding well-formed tickets", () => {
  it.each([[TestData.regular, TestData.regular.key], [TestData.nullDescription, TestData.nullDescription.key]])(
    "decodes as expected",
    (data, expectedKey) => {
      // Given a well-formed bit of data.

      // When it is decoded.
      const actual = Issue.decode(data);

      // Then no errors should be reported.
      const actualErrors = E.isLeft(actual) ? JSON.stringify(PathReporter.report(actual), null, 2) : undefined;
      expect(actualErrors).toBeUndefined();

      // And the decoded key should match the expected one.
      if (isLeft(actual)) {
        fail(`[${actual}] is unexpectedly left.`);
      } else {
        expect(actual.right.key).toEqual(expectedKey)
      }
    }
  );
});

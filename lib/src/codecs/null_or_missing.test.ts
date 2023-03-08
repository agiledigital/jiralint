// TODO Promote this to at least ReadonlyDeep
/* eslint functional/prefer-immutable-types: ["error", { "enforcement": "ReadonlyShallow" }] */

/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statements */
/* eslint-disable functional/no-throw-statements */
/* eslint-disable functional/no-conditional-statements */
/* eslint-disable jest/no-conditional-expect */
import * as T from "io-ts";
import { nullOrMissingToUndefined } from "./null_or_missing";
import { PathReporter } from "io-ts/PathReporter";
import { isLeft } from "fp-ts/lib/These";

const nullValue = {
  a: 10,
  b: null,
} as const;

const missingValue = {
  a: 10,
} as const;

const presentValue = {
  a: 10,
  b: "hi",
} as const;

describe("null or missing codec", () => {
  it.each([
    [nullValue, undefined],
    [missingValue, undefined],
    [presentValue, "hi"],
  ])("should decode as expected", (value, expected) => {
    // Given a codec that expects an `a` and is tolerant of 'missing' `b`.
    const codec = T.type({
      a: T.number,
      b: nullOrMissingToUndefined(T.string),
    });

    // When the test data is decoded.
    const actual = codec.decode(value);

    // Then it should be decoded successfully AND the decoder should
    // be tolerant of missing / null values for b.
    if (isLeft(actual)) {
      throw new Error(
        `[${JSON.stringify(actual, null, 2)}] is unexpectedly left.`
      );
    } else {
      expect(actual.right.b).toEqual(expected);
    }
  });

  test("should fail if the value of b does not match the expected type", () => {
    // Given a codec that expects a string but tolerates 'missing' values.
    const codec = nullOrMissingToUndefined(T.string);

    // When a boolean is decoded.
    const actual = codec.decode(false);

    // Then it should have failed decoding.
    if (isLeft(actual)) {
      const error = JSON.stringify(PathReporter.report(actual), null, 2);
      expect(error).toContain("Invalid value false supplied to : fromNullable");
    } else {
      throw new Error(
        `[${JSON.stringify(actual, null, 2)}] is unexpectedly left.`
      );
    }
  });
});

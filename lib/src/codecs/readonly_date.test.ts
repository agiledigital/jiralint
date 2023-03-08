// TODO Promote this to at least ReadonlyDeep
/* eslint functional/prefer-immutable-types: ["error", { "enforcement": "ReadonlyShallow" }] */

/* eslint-disable functional/no-return-void */
/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statements */
/* eslint-disable functional/no-throw-statements */
/* eslint-disable functional/no-conditional-statements */
/* eslint-disable jest/no-conditional-expect */
import { isLeft } from "fp-ts/lib/These";
import {
  readonlyDateFromDate,
  readOnlyDateFromISOString,
} from "./readonly_date";
import * as ITT from "io-ts-types";
import fc from "fast-check";

describe("decoding a Date", () => {
  it("should decode a date to a readonly date", () => {
    fc.assert(
      // eslint-disable-next-line functional/prefer-immutable-types
      fc.property(fc.date(), (d) => {
        // Given a date,

        // When it is decoded to a readonly date.
        const actual = readonlyDateFromDate.decode(d);

        // Then it should have been successfully decoded.
        if (isLeft(actual)) {
          throw new Error(
            `[${JSON.stringify(actual, null, 2)}] is unexpectedly left.`
          );
        } else {
          // And be equivalent to the the original date.
          expect(actual.right.valueOf()).toEqual(d.valueOf());
        }
      })
    );
  });
});

describe("decoding a string", () => {
  it("should always pass issues in review or completed that have a non-empty statement", () => {
    fc.assert(
      // eslint-disable-next-line functional/prefer-immutable-types
      fc.property(fc.date(), (d) => {
        // Given a date,

        // That has been encoded as a ISO string.
        const isoDate = ITT.DateFromISOString.encode(d);

        // When it is decoded to a readonly date.
        const actual = readOnlyDateFromISOString.decode(isoDate);

        // Then it should have been successfully decoded.
        if (isLeft(actual)) {
          throw new Error(
            `[${JSON.stringify(actual, null, 2)}] is unexpectedly left.`
          );
        } else {
          // And be equivalent to the the original date.
          expect(actual.right.valueOf()).toEqual(d.valueOf());
        }
      })
    );
  });
});
